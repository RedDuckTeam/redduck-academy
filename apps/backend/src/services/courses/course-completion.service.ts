import { eq, and, inArray } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { userLessons } from '../../db/schema'

export class CourseCompletionService {
  /**
   * Returns true if the user has completed all non-lecture, non-hidden lessons in the course.
   */
  static async isCompletedByUser(userId: string, courseId: number): Promise<boolean> {
    const course = await payloadDb.query.courses.findFirst({
      where: (c, { eq: eqFn, and: andFn, ne }) => andFn(eqFn(c.id, courseId), ne(c.isHidden, true)),
      with: {
        modules: {
          where: (m, { ne }) => ne(m.isHidden, true),
          with: {
            lessons: {
              where: (l, { ne }) => ne(l.isHidden, true),
              columns: { id: true, type: true },
            },
          },
        },
      },
    })

    if (!course) return false

    const gradedLessonIds = (course.modules ?? [])
      .flatMap((m) => m.lessons ?? [])
      .filter((l) => l.type !== 'lecture')
      .map((l) => l.id)

    if (gradedLessonIds.length === 0) return true

    const completedRows = await db
      .select({ lessonId: userLessons.lessonId })
      .from(userLessons)
      .where(
        and(
          eq(userLessons.userId, userId),
          eq(userLessons.isCompleted, true),
          inArray(userLessons.lessonId, gradedLessonIds),
        ),
      )

    const completedIds = new Set(completedRows.map((r) => r.lessonId))
    return gradedLessonIds.every((id) => completedIds.has(id))
  }
}
