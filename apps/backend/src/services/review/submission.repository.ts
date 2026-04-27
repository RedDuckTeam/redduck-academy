import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { AppError } from '../../lib/errors'
import { projectUserSubmissions, userLessons } from '../../db/schema'
import type { ReviewFeedback } from '../../types/review-feedback'

export const SubmissionRepository = {
  /**
   * Upserts the user-lesson row, guards against duplicate pending submissions,
   * then creates a new submission record — all in one transaction.
   * Returns the new submission id.
   */
  async createForReview(userId: string, lessonId: number, repoUrl: string): Promise<number> {
    return db.transaction(async (tx) => {
      // Upsert so RETURNING always yields a row (onConflictDoNothing wouldn't return the existing one).
      const [userLesson] = await tx
        .insert(userLessons)
        .values({ userId, lessonId, isCompleted: false })
        .onConflictDoUpdate({
          target: [userLessons.userId, userLessons.lessonId],
          set: { id: sql`${userLessons.id}` }, // no-op keeps RETURNING working
        })
        .returning()

      if (!userLesson) {
        throw new AppError(500, 'Failed to resolve user lesson row')
      }

      const [pending] = await tx
        .select({ id: projectUserSubmissions.id })
        .from(projectUserSubmissions)
        .where(
          and(eq(projectUserSubmissions.userLessonId, userLesson.id), eq(projectUserSubmissions.status, 'pending')),
        )
        .limit(1)

      if (pending) {
        throw new AppError(409, 'A review is already in progress for this lesson')
      }

      const [submission] = await tx
        .insert(projectUserSubmissions)
        .values({ userLessonId: userLesson.id, repoUrl, status: 'pending' })
        .returning({ id: projectUserSubmissions.id })

      return submission.id
    })
  },

  async findCompletedByCommit(userLessonId: number, commitSha: string) {
    const [row] = await db
      .select({ id: projectUserSubmissions.id })
      .from(projectUserSubmissions)
      .where(
        and(
          eq(projectUserSubmissions.userLessonId, userLessonId),
          eq(projectUserSubmissions.commitSha, commitSha),
          eq(projectUserSubmissions.status, 'completed'),
        ),
      )
      .limit(1)
    return row ?? null
  },

  async getUserLesson(userId: string, lessonId: number) {
    const [row] = await db
      .select({ id: userLessons.id })
      .from(userLessons)
      .where(and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lessonId)))
      .limit(1)
    return row ?? null
  },

  /** Oldest first — tab label Attempt 1..N; latest is `.at(-1)`. */
  async listForUserLesson(userLessonId: number) {
    return db
      .select({
        id: projectUserSubmissions.id,
        status: projectUserSubmissions.status,
        submittedAt: projectUserSubmissions.submittedAt,
        batchRequestId: projectUserSubmissions.batchRequestId,
        feedback: projectUserSubmissions.feedback,
        errorMessage: projectUserSubmissions.errorMessage,
      })
      .from(projectUserSubmissions)
      .where(eq(projectUserSubmissions.userLessonId, userLessonId))
      .orderBy(asc(projectUserSubmissions.submittedAt))
  },

  async updateBatch(submissionId: number, batchRequestId: string, commitSha: string | null) {
    await db
      .update(projectUserSubmissions)
      .set({ batchRequestId, commitSha })
      .where(eq(projectUserSubmissions.id, submissionId))
  },

  async markFailed(submissionId: number, message: string) {
    await db
      .update(projectUserSubmissions)
      .set({ status: 'failed', errorMessage: message, completedAt: new Date() })
      .where(eq(projectUserSubmissions.id, submissionId))
  },

  async complete(submissionId: number, userLessonId: number, feedback: ReviewFeedback, passed: boolean) {
    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(projectUserSubmissions)
        .set({ status: 'completed', feedback, completedAt: new Date(), errorMessage: null })
        .where(
          and(
            eq(projectUserSubmissions.id, submissionId),
            eq(projectUserSubmissions.status, 'pending'), // guard against double-complete
          ),
        )
        .returning({ id: projectUserSubmissions.id })

      if (!updated) return

      await tx.update(userLessons).set({ isCompleted: passed }).where(eq(userLessons.id, userLessonId))
    })
  },
}
