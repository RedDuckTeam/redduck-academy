import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { AppError } from '../../lib/errors'
import { codingTaskReviewCache, codingTaskSubmissions, userLessons } from '../../db/schema'

export const CodingTaskRepository = {
  /**
   * Upserts the user-lesson row, enforces attempt limits, inserts the submission,
   * and updates the user-lesson score/completion — all in one transaction.
   * Returns the new submission id and updated attemptsLeft.
   */
  async createSubmission(
    userId: string,
    lessonId: number,
    submittedCode: string,
    language: string,
    passed: boolean,
    lessonMaxPoints: number,
  ): Promise<{ submissionId: number; attemptsLeft: number }> {
    return db.transaction(async (tx) => {
      const [userLesson] = await tx
        .insert(userLessons)
        .values({ userId, lessonId, isCompleted: false })
        .onConflictDoUpdate({
          target: [userLessons.userId, userLessons.lessonId],
          set: { id: sql`${userLessons.id}` },
        })
        .returning()

      if (!userLesson) {
        throw new AppError(500, 'Failed to resolve user lesson row')
      }
      if ((userLesson.attemptsLeft ?? 0) <= 0) {
        throw new AppError(400, 'No attempts left for this lesson')
      }

      const [submission] = await tx
        .insert(codingTaskSubmissions)
        .values({ userLessonId: userLesson.id, submittedCode, language, passed })
        .returning({ id: codingTaskSubmissions.id })

      const score = passed ? lessonMaxPoints : 0
      const newAttemptsLeft = Math.max((userLesson.attemptsLeft ?? 1) - 1, 0)

      await tx
        .update(userLessons)
        .set({
          score: passed ? sql`GREATEST(COALESCE(${userLessons.score}, 0), ${score})` : userLessons.score,
          isCompleted: passed ? true : userLessons.isCompleted,
          attemptsLeft: sql`GREATEST(${userLessons.attemptsLeft} - 1, 0)`,
        })
        .where(eq(userLessons.id, userLesson.id))

      return { submissionId: submission.id, attemptsLeft: newAttemptsLeft }
    })
  },

  async listForUserLesson(userLessonId: number) {
    return db
      .select({
        id: codingTaskSubmissions.id,
        passed: codingTaskSubmissions.passed,
        submittedAt: codingTaskSubmissions.submittedAt,
        submittedCode: codingTaskSubmissions.submittedCode,
      })
      .from(codingTaskSubmissions)
      .where(eq(codingTaskSubmissions.userLessonId, userLessonId))
      .orderBy(asc(codingTaskSubmissions.submittedAt))
  },

  async getUserLesson(userId: string, lessonId: number) {
    const [row] = await db
      .select({ id: userLessons.id, attemptsLeft: userLessons.attemptsLeft })
      .from(userLessons)
      .where(and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lessonId)))
      .limit(1)
    return row ?? null
  },

  async getCachedReview(lessonId: number, codeHash: string): Promise<boolean | null> {
    const [row] = await db
      .select({ passed: codingTaskReviewCache.passed })
      .from(codingTaskReviewCache)
      .where(and(eq(codingTaskReviewCache.lessonId, lessonId), eq(codingTaskReviewCache.codeHash, codeHash)))
      .limit(1)
    return row?.passed ?? null
  },

  async setCachedReview(lessonId: number, codeHash: string, passed: boolean): Promise<void> {
    await db
      .insert(codingTaskReviewCache)
      .values({ lessonId, codeHash, passed })
      .onConflictDoNothing()
  },
}
