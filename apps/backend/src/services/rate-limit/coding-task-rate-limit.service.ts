import { and, eq, gt, or, sql } from 'drizzle-orm'
import { db } from '../../db'
import { codingTaskSubmissions, userLessons } from '../../db/schema'

const COOLDOWN_MS = 10 * 1000
const DAILY_LIMIT_PER_LESSON = 50
const MONTHLY_LIMIT_PER_LESSON = 500
const DAY_MS = 24 * 60 * 60 * 1000
const MONTH_MS = 30 * DAY_MS

export type RateLimitReason = 'cooldown' | 'daily' | 'monthly'

export interface RateLimitAllowed {
  allowed: true
}

export interface RateLimitDenied {
  allowed: false
  reason: RateLimitReason
  retryAfterMs: number
  resetAt?: string
}

export type RateLimitResult = RateLimitAllowed | RateLimitDenied

interface Counters {
  lastSubmittedAt: Date | null
  dayCount: number
  dayOldest: Date | null
  monthCount: number
  monthOldest: Date | null
}

async function getCountersForUserAndIp(
  userId: string,
  ipAddress: string,
  lessonId: number,
  now: Date,
): Promise<{ user: Counters; ip: Counters }> {
  // The `postgres` driver doesn't serialize Date objects inside sql template params,
  // so we bind ISO strings and cast them to timestamp in the query.
  const dayCutoffIso = new Date(now.getTime() - DAY_MS).toISOString()
  const monthCutoffIso = new Date(now.getTime() - MONTH_MS).toISOString()

  // One round-trip. Conditional aggregates give us cooldown + daily + monthly in one shot,
  // computed independently for the user scope and the IP scope.
  const [row] = await db
    .select({
      userLast: sql<Date | null>`MAX(${codingTaskSubmissions.submittedAt}) FILTER (WHERE ${userLessons.userId} = ${userId})`,
      userDayCount: sql<number>`COUNT(*) FILTER (WHERE ${userLessons.userId} = ${userId} AND ${userLessons.lessonId} = ${lessonId} AND ${codingTaskSubmissions.submittedAt} > ${dayCutoffIso})`.mapWith(Number),
      userDayOldest: sql<Date | null>`MIN(${codingTaskSubmissions.submittedAt}) FILTER (WHERE ${userLessons.userId} = ${userId} AND ${userLessons.lessonId} = ${lessonId} AND ${codingTaskSubmissions.submittedAt} > ${dayCutoffIso})`,
      userMonthCount: sql<number>`COUNT(*) FILTER (WHERE ${userLessons.userId} = ${userId} AND ${userLessons.lessonId} = ${lessonId} AND ${codingTaskSubmissions.submittedAt} > ${monthCutoffIso})`.mapWith(Number),
      userMonthOldest: sql<Date | null>`MIN(${codingTaskSubmissions.submittedAt}) FILTER (WHERE ${userLessons.userId} = ${userId} AND ${userLessons.lessonId} = ${lessonId} AND ${codingTaskSubmissions.submittedAt} > ${monthCutoffIso})`,
      ipLast: sql<Date | null>`MAX(${codingTaskSubmissions.submittedAt}) FILTER (WHERE ${codingTaskSubmissions.ipAddress} = ${ipAddress})`,
      ipDayCount: sql<number>`COUNT(*) FILTER (WHERE ${codingTaskSubmissions.ipAddress} = ${ipAddress} AND ${userLessons.lessonId} = ${lessonId} AND ${codingTaskSubmissions.submittedAt} > ${dayCutoffIso})`.mapWith(Number),
      ipDayOldest: sql<Date | null>`MIN(${codingTaskSubmissions.submittedAt}) FILTER (WHERE ${codingTaskSubmissions.ipAddress} = ${ipAddress} AND ${userLessons.lessonId} = ${lessonId} AND ${codingTaskSubmissions.submittedAt} > ${dayCutoffIso})`,
      ipMonthCount: sql<number>`COUNT(*) FILTER (WHERE ${codingTaskSubmissions.ipAddress} = ${ipAddress} AND ${userLessons.lessonId} = ${lessonId} AND ${codingTaskSubmissions.submittedAt} > ${monthCutoffIso})`.mapWith(Number),
      ipMonthOldest: sql<Date | null>`MIN(${codingTaskSubmissions.submittedAt}) FILTER (WHERE ${codingTaskSubmissions.ipAddress} = ${ipAddress} AND ${userLessons.lessonId} = ${lessonId} AND ${codingTaskSubmissions.submittedAt} > ${monthCutoffIso})`,
    })
    .from(codingTaskSubmissions)
    .innerJoin(userLessons, eq(codingTaskSubmissions.userLessonId, userLessons.id))
    // Prune scanned rows to the widest window (monthly) AND to either this user or this IP.
    // Lets the planner use (user_lesson_id, submitted_at) or (ip_address, submitted_at) indexes
    // via BitmapOr, instead of scanning the whole table to evaluate the FILTER aggregates.
    .where(
      and(
        gt(codingTaskSubmissions.submittedAt, sql`${monthCutoffIso}::timestamp`),
        or(
          eq(userLessons.userId, userId),
          eq(codingTaskSubmissions.ipAddress, ipAddress),
        ),
      ),
    )

  return {
    user: {
      lastSubmittedAt: row?.userLast ? new Date(row.userLast) : null,
      dayCount: row?.userDayCount ?? 0,
      dayOldest: row?.userDayOldest ? new Date(row.userDayOldest) : null,
      monthCount: row?.userMonthCount ?? 0,
      monthOldest: row?.userMonthOldest ? new Date(row.userMonthOldest) : null,
    },
    ip: {
      lastSubmittedAt: row?.ipLast ? new Date(row.ipLast) : null,
      dayCount: row?.ipDayCount ?? 0,
      dayOldest: row?.ipDayOldest ? new Date(row.ipDayOldest) : null,
      monthCount: row?.ipMonthCount ?? 0,
      monthOldest: row?.ipMonthOldest ? new Date(row.ipMonthOldest) : null,
    },
  }
}

export const CodingTaskRateLimitService = {
  async check(userId: string, ipAddress: string, lessonId: number): Promise<RateLimitResult> {
    const now = new Date()
    const { user, ip } = await getCountersForUserAndIp(userId, ipAddress, lessonId, now)

    // Monthly cap (first — users hitting it shouldn't also see cooldown copy).
    const monthlyOverLimit =
      user.monthCount >= MONTHLY_LIMIT_PER_LESSON || ip.monthCount >= MONTHLY_LIMIT_PER_LESSON
    if (monthlyOverLimit) {
      // Slot frees up when the oldest in-window submission ages out.
      const oldest =
        user.monthCount >= MONTHLY_LIMIT_PER_LESSON ? user.monthOldest : ip.monthOldest
      const resetAtMs = (oldest?.getTime() ?? now.getTime()) + MONTH_MS
      return {
        allowed: false,
        reason: 'monthly',
        retryAfterMs: Math.max(resetAtMs - now.getTime(), 0),
        resetAt: new Date(resetAtMs).toISOString(),
      }
    }

    // Daily cap.
    const dailyOverLimit =
      user.dayCount >= DAILY_LIMIT_PER_LESSON || ip.dayCount >= DAILY_LIMIT_PER_LESSON
    if (dailyOverLimit) {
      const oldest =
        user.dayCount >= DAILY_LIMIT_PER_LESSON ? user.dayOldest : ip.dayOldest
      const resetAtMs = (oldest?.getTime() ?? now.getTime()) + DAY_MS
      return {
        allowed: false,
        reason: 'daily',
        retryAfterMs: Math.max(resetAtMs - now.getTime(), 0),
        resetAt: new Date(resetAtMs).toISOString(),
      }
    }

    // Cooldown — global across all coding tasks, per user AND per IP.
    const lastAny = Math.max(
      user.lastSubmittedAt?.getTime() ?? 0,
      ip.lastSubmittedAt?.getTime() ?? 0,
    )
    if (lastAny > 0) {
      const elapsed = now.getTime() - lastAny
      if (elapsed < COOLDOWN_MS) {
        return {
          allowed: false,
          reason: 'cooldown',
          retryAfterMs: COOLDOWN_MS - elapsed,
        }
      }
    }

    return { allowed: true }
  },
}
