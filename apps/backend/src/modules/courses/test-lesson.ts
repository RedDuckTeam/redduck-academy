import { Context } from 'hono'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { courses, lessons } from '../../db/payload-schema'
import { user } from '../../db/auth-schema'
import { userLessons } from '../../db/schema'
import { auth } from '../../lib/auth'

export const getLessonHandler = async (c: Context) => {
  const courseSlug = c.req.param('courseSlug')
  const lessonSlug = c.req.param('lessonSlug')
  
  try {
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
                    options: {
                      columns: {
                        id: true,
                        order: true,
                        parentId: true,
                        label: true,
                        isCorrect: true, // we need it to calculate isMultipleChoices, we strip it later
                      }
                    },
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
    
    // Find the actual lesson inside the returned tree
    let foundLesson = null;
    for (const mod of courseData.modules) {
      if (mod.lessons && mod.lessons.length > 0) {
        foundLesson = mod.lessons[0];
        break;
      }
    }

    if (!foundLesson) {
      return c.json({ error: 'Lesson not found' }, 404)
    }
    
    // Compute `isMultipleChoices` and remove `isCorrect` from options before returning
    if (foundLesson.questions) {
      foundLesson.questions = foundLesson.questions.map((q: any) => {
        const correctCount = q.options?.filter((o: any) => o.isCorrect).length || 0
        const isMultipleChoices = correctCount > 1
        
        return {
          ...q,
          isMultipleChoices,
          options: q.options?.map((o: any) => {
            const { isCorrect, ...safeOption } = o
            return safeOption
          })
        }
      })
    }
    
    return c.json({ data: foundLesson })
  } catch (error) {
    console.error(`Error fetching lesson ${lessonSlug} for course ${courseSlug}:`, error)
    return c.json({ error: 'Failed to fetch lesson' }, 500)
  }
}

export const validateTestLessonHandler = async (c: Context) => {
  const courseSlug = c.req.param('courseSlug')
  const lessonSlug = c.req.param('lessonSlug')

  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session || !session.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userAnswers = await c.req.json() as Record<string, string[]>

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
}
