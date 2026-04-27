import { and, asc, eq, lt, sql } from 'drizzle-orm'
import { db } from '../../db'
import { AppError } from '../../lib/errors'
import { codingTaskReviewCache, codingTaskSubmissions, userLessons } from '../../db/schema'

const CACHE_CLEANUP_PROBABILITY = 0.01
const CACHE_RETENTION_DAYS = 30

async function maybeCleanupReviewCache(): Promise<void> {
  if (Math.random() >= CACHE_CLEANUP_PROBABILITY) return
  try {
    await db
      .delete(codingTaskReviewCache)
      .where(lt(codingTaskReviewCache.createdAt, sql`now() - interval '${sql.raw(String(CACHE_RETENTION_DAYS))} days'`))
  } catch {
    // best-effort; never block the caller
  }
}

export const CodingTaskRepository = {
  /**
   * Upserts the user-lesson row, inserts the submission, and updates completion — all in one transaction.
   * Returns the new submission id.
   */
  async createSubmission(
    userId: string,
    lessonId: number,
    submittedCode: string,
    language: string,
    passed: boolean,
    aiComment: string | null,
    ipAddress: string,
  ): Promise<{ submissionId: number }> {
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

      const [submission] = await tx
        .insert(codingTaskSubmissions)
        .values({
          userLessonId: userLesson.id,
          submittedCode,
          language,
          passed,
          aiComment,
          ipAddress: ipAddress || null,
        })
        .returning({ id: codingTaskSubmissions.id })

      if (passed) {
        await tx
          .update(userLessons)
          .set({ isCompleted: true })
          .where(eq(userLessons.id, userLesson.id))
      }

      return { submissionId: submission.id }
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

  async listForUserLessonAdmin(userLessonId: number) {
    return db
      .select({
        id: codingTaskSubmissions.id,
        passed: codingTaskSubmissions.passed,
        submittedAt: codingTaskSubmissions.submittedAt,
        submittedCode: codingTaskSubmissions.submittedCode,
        aiComment: codingTaskSubmissions.aiComment,
      })
      .from(codingTaskSubmissions)
      .where(eq(codingTaskSubmissions.userLessonId, userLessonId))
      .orderBy(asc(codingTaskSubmissions.submittedAt))
  },

  async getUserLesson(userId: string, lessonId: number) {
    const [row] = await db
      .select({ id: userLessons.id })
      .from(userLessons)
      .where(and(eq(userLessons.userId, userId), eq(userLessons.lessonId, lessonId)))
      .limit(1)
    return row ?? null
  },

  async getCachedReview(
    lessonId: number,
    codeHash: string,
  ): Promise<{ passed: boolean; aiComment: string | null } | null> {
    const [row] = await db
      .select({ passed: codingTaskReviewCache.passed, aiComment: codingTaskReviewCache.aiComment })
      .from(codingTaskReviewCache)
      .where(and(eq(codingTaskReviewCache.lessonId, lessonId), eq(codingTaskReviewCache.codeHash, codeHash)))
      .limit(1)
    return row ?? null
  },

  async setCachedReview(
    lessonId: number,
    codeHash: string,
    passed: boolean,
    aiComment: string | null,
  ): Promise<void> {
    void maybeCleanupReviewCache()
    await db
      .insert(codingTaskReviewCache)
      .values({ lessonId, codeHash, passed, aiComment })
      .onConflictDoNothing()
  },
}
