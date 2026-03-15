import { eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { courses, lessons } from '../db/payload-schema'
import { user } from '../db/auth-schema'
import { userLessons } from '../db/schema'
import { HTTPException } from 'hono/http-exception'

export class CoursesService {
  static async listCoursesInfo() {
    const allCourses = await db.query.courses.findMany({
      columns: { id: true, title: true },
      with: {
        modules: {
          with: {
            lessons: {
              columns: { type: true, maxPoints: true },
              with: {
                questions: { columns: { points: true } },
              },
            },
          },
        },
      },
    })

    return allCourses.map((course: any) => {
      const courseLessons = course.modules.flatMap((m: any) => m.lessons)
      const totalTasks = courseLessons.filter((l: any) => l.type !== 'lecture').length
      const totalPoints = courseLessons.reduce((sum: number, lesson: any) => {
        if (lesson.type === 'lecture') return sum
        if (lesson.type === 'test') {
          const questionPoints = lesson.questions?.reduce((qSum: number, q: any) => qSum + (q.points ?? 5), 0) ?? 0
          return sum + questionPoints
        }
        return sum + (lesson.maxPoints ?? 0)
      }, 0)

      return {
        id: course.id,
        title: course.title,
        totalPoints,
        totalTasks,
      }
    })
  }

  static async validateTestLesson(
    courseSlug: string,
    lessonSlug: string,
    userId: string,
    userAnswers: Record<string, string[]>,
  ) {
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
      throw new HTTPException(404, { message: 'Course not found' })
    }

    let foundLesson: any = null
    for (const mod of courseData.modules) {
      if (mod.lessons && mod.lessons.length > 0) {
        foundLesson = mod.lessons[0]
        break
      }
    }

    if (!foundLesson || foundLesson.type !== 'test') {
      throw new HTTPException(404, { message: 'Lesson not found or not a test' })
    }

    let totalScore = 0
    const correctAnswers: Record<string, string[]> = {}

    foundLesson.questions.forEach((q: any) => {
      const correctOptionIds = q.options.filter((o: any) => o.isCorrect).map((o: any) => o.id) || []
      correctAnswers[q.id] = correctOptionIds

      const submission = userAnswers[q.id] || []

      const isCorrect =
        correctOptionIds.length === submission.length &&
        correctOptionIds.every((id: string) => submission.includes(id))

      if (isCorrect) {
        totalScore += q.points ?? 5
      }
    })

    await db.transaction(async (tx) => {
      if (totalScore > 0) {
        await tx
          .update(user)
          .set({
            points: sql`${user.points} + ${totalScore}`,
          })
          .where(eq(user.id, userId))
      }

      await tx.insert(userLessons).values({
        userId: userId,
        lessonId: foundLesson.id as number,
        score: totalScore,
        userAnswers: userAnswers,
        isCompleted: true,
      })
    })

    return {
      score: totalScore,
      correctAnswers,
    }
  }
}
