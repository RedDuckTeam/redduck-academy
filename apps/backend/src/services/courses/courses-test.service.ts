import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { userLessons } from '../../db/schema'
import { AppError } from '../../lib/errors'
import { CoursesService } from './courses.service'

export class CoursesTestService {
  static async validateTestLesson(
    courseSlug: string,
    lessonSlug: string,
    userId: string,
    userAnswers: Record<string, string[]>,
  ) {
    const result = await CoursesService.getTestLessonWithQuestions(courseSlug, lessonSlug)
    if (!result) {
      throw new AppError(404, 'Lesson not found or not a test')
    }

    const [existing] = await db
      .select({ userAnswers: userLessons.userAnswers })
      .from(userLessons)
      .where(
        and(
          eq(userLessons.userId, userId),
          eq(userLessons.lessonId, result.lesson.id),
          eq(userLessons.isCompleted, true),
        ),
      )
      .limit(1)

    // Already passed — idempotent.
    if (existing) return

    const { lesson: foundLesson, questions } = result

    const allCorrect = questions.every((q) => {
      const correctIds = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id))
      const userIds = new Set(userAnswers[q.id] ?? [])
      if (correctIds.size !== userIds.size) return false
      for (const id of correctIds) {
        if (!userIds.has(id)) return false
      }
      return true
    })

    // Persist the attempt: `isCompleted` only flips to true on a fully-correct
    // submission, but we always save `userAnswers` so retakes can show a review
    // of the last attempt. Retries hit `onConflictDoUpdate` (the early-return
    // above guards against overwriting an already-passed row).
    await db
      .insert(userLessons)
      .values({
        userId,
        lessonId: foundLesson.id,
        userAnswers,
        isCompleted: allCorrect,
      })
      .onConflictDoUpdate({
        target: [userLessons.userId, userLessons.lessonId],
        set: { userAnswers, isCompleted: allCorrect },
      })
  }
}
