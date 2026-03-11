import { createFactory } from 'hono/factory'
import { validator } from 'hono-openapi'
import { z } from 'zod'
import { validateTestLessonDesc } from '../../descriptions/courses'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { courses, lessons } from '../../db/payload-schema'
import { user } from '../../db/auth-schema'
import { userLessons } from '../../db/schema'
import { auth } from '../../lib/auth'

const factory = createFactory()

const courseLessonParamSchema = z.object({
  courseSlug: z.string(),
  lessonSlug: z.string(),
})

/** User answers: question ID -> array of selected option IDs */
const validateAnswersSchema = z.record(z.string(), z.array(z.string()))

export const validateTestLessonHandler = factory.createHandlers(
  validateTestLessonDesc,
  validator('param', courseLessonParamSchema),
  validator('json', validateAnswersSchema),
  async (c) => {
  const { courseSlug, lessonSlug } = c.req.valid('param')
  const userAnswers = c.req.valid('json')

  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session || !session.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get the course/lesson tree exactly as in the GET endpoint to verify it exists and get question data
    const courseData = await db.query.courses.findFirst({
      where: eq(courses.slug, courseSlug),
      with: {
        modules: {
          with: {
            lessons: {
              where: eq(lessons.slug, lessonSlug),
              with: {
                questions: {
                  with: {
                    options: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!courseData) {
      return c.json({ error: 'Course not found' }, 404)
    }

    let foundLesson: any = null;
    for (const mod of courseData.modules) {
      if (mod.lessons && mod.lessons.length > 0) {
        foundLesson = mod.lessons[0];
        break;
      }
    }

    if (!foundLesson || foundLesson.type !== 'test') {
      return c.json({ error: 'Lesson not found or not a test' }, 404)
    }

    // Now securely calculate the score
    let totalScore = 0
    const correctAnswers: Record<string, string[]> = {}

    foundLesson.questions.forEach((q: any) => {
      const correctOptionIds = q.options.filter((o: any) => o.isCorrect).map((o: any) => o.id) || []
      correctAnswers[q.id] = correctOptionIds

      const submission = userAnswers[q.id] || []

      // Simple array equality for string IDs without considering order
      const isCorrect =
        correctOptionIds.length === submission.length &&
        correctOptionIds.every((id: string) => submission.includes(id))

      if (isCorrect) {
        totalScore += (q.points ?? 5)
      }
    })

    // Now update BetterAuth user points if the user scored any points
    if (totalScore > 0) {
      await db.update(user)
        .set({
          points: sql`${user.points} + ${totalScore}`,
        })
        .where(eq(user.id, session.user.id))
    }

    // Store user results and answers!
    await db.insert(userLessons).values({
      userId: session.user.id,
      lessonId: foundLesson.id as number,
      score: totalScore,
      userAnswers: userAnswers,
      isCompleted: true,
    })

    return c.json({
      score: totalScore,
      correctAnswers,
    })
  } catch (error) {
    console.error(`Error validating lesson ${lessonSlug} for course ${courseSlug}:`, error)
    return c.json({ error: 'Failed to validate lesson' }, 500)
  }
})
