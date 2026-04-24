import { and, eq, lt, sql } from 'drizzle-orm'
import { db } from '../../db'
import { submissionRateLimits } from '../../db/schema'

const WINDOW_SIZE = 5
const MAX_WINDOW_HOURS = 168 // 1 week cap
const CLEANUP_PROBABILITY = 0.01
const CLEANUP_RETENTION_DAYS = 7

export interface RateLimitResult {
  allowed: true
  attemptsRemaining: number
}

export interface RateLimitDenied {
  allowed: false
  retryAfterMs: number
}

export type RateLimitCheckResult = RateLimitResult | RateLimitDenied

function windowDurationForExhaust(exhaustCount: number): number {
  return Math.min(Math.pow(2, exhaustCount), MAX_WINDOW_HOURS)
}

function isWindowExpired(windowStart: Date, windowDurationHours: number): boolean {
  const windowEndMs = windowStart.getTime() + windowDurationHours * 60 * 60 * 1000
  return Date.now() >= windowEndMs
}

async function maybeCleanupExpired(): Promise<void> {
  if (Math.random() >= CLEANUP_PROBABILITY) return
  try {
    await db
      .delete(submissionRateLimits)
      .where(lt(submissionRateLimits.updatedAt, sql`now() - interval '${sql.raw(String(CLEANUP_RETENTION_DAYS))} days'`))
  } catch {
    // best-effort; never block the caller
  }
}

export const SubmissionRateLimitService = {
  async checkAndConsume(userId: string, ipAddress: string, lessonId: number): Promise<RateLimitCheckResult> {
    void maybeCleanupExpired()
    return db.transaction(async (tx) => {
      // Fetch IP-scoped row (canonical window tracker)
      const [ipRow] = await tx
        .select()
        .from(submissionRateLimits)
        .where(and(eq(submissionRateLimits.ipAddress, ipAddress), eq(submissionRateLimits.lessonId, lessonId)))
        .limit(1)

      // Also fetch user-scoped row to detect cross-account IP abuse
      const [userRow] = userId
        ? await tx
            .select()
            .from(submissionRateLimits)
            .where(and(eq(submissionRateLimits.userId, userId), eq(submissionRateLimits.lessonId, lessonId)))
            .limit(1)
        : [undefined]

      // Use the highest exhaust count seen across IP and user rows
      const effectiveExhaustCount = Math.max(
        ipRow?.exhaustCount ?? 0,
        userRow?.exhaustCount ?? 0,
      )

      if (!ipRow) {
        // First submission from this IP for this lesson
        await tx.insert(submissionRateLimits).values({
          userId: userId || null,
          ipAddress,
          lessonId,
          attemptsUsed: 1,
          exhaustCount: 0,
          windowDurationHours: 1,
        })
        return { allowed: true, attemptsRemaining: WINDOW_SIZE - 1 }
      }

      const windowStart = new Date(ipRow.windowStart)
      const expired = isWindowExpired(windowStart, ipRow.windowDurationHours)

      if (expired) {
        // Start a new window; duration is based on how many times user has exhausted
        const newDurationHours = windowDurationForExhaust(effectiveExhaustCount)
        await tx
          .update(submissionRateLimits)
          .set({
            userId: userId || null,
            windowStart: new Date(),
            windowDurationHours: newDurationHours,
            attemptsUsed: 1,
            exhaustCount: effectiveExhaustCount + 1,
          })
          .where(eq(submissionRateLimits.id, ipRow.id))
        return { allowed: true, attemptsRemaining: WINDOW_SIZE - 1 }
      }

      if (ipRow.attemptsUsed < WINDOW_SIZE) {
        // Window active, attempts remaining
        await tx
          .update(submissionRateLimits)
          .set({ attemptsUsed: ipRow.attemptsUsed + 1 })
          .where(eq(submissionRateLimits.id, ipRow.id))
        return { allowed: true, attemptsRemaining: WINDOW_SIZE - ipRow.attemptsUsed - 1 }
      }

      // Window active and exhausted — calculate when it resets
      const windowEndMs = windowStart.getTime() + ipRow.windowDurationHours * 60 * 60 * 1000
      const retryAfterMs = Math.max(windowEndMs - Date.now(), 0)
      return { allowed: false, retryAfterMs }
    })
  },
}
