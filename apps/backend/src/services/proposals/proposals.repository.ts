import { gt, sql } from 'drizzle-orm'
import { db } from '../../db'
import { contentProposals } from '../../db/schema'
import { AppError } from '../../lib/errors'

export type ProposalDoor = (typeof contentProposals.$inferSelect)['door']

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/**
 * Anonymous door, per IP prefix. A visitor fixing typos across a handful of lessons in one sitting
 * stays under it; a script does not. Per day rather than per hour because the cost of an abusive
 * proposal is a maintainer's attention, and that does not replenish hourly.
 */
const ANONYMOUS_LIMIT = 5
const ANONYMOUS_WINDOW_MS = DAY_MS

/**
 * Signed-in door, per Privy user — eight times the anonymous allowance, because the identity is
 * verifiable and revocable. Deliberately keyed on the account and nothing else: a school or an
 * office shares one NAT address, so adding an IP bucket here would let a single bad actor on that
 * network lock out every other identified contributor behind it.
 */
const SIGNED_IN_LIMIT = 40
const SIGNED_IN_WINDOW_MS = DAY_MS

/**
 * Per target file, both doors together. Neither per-contributor bucket can see one lesson being
 * swarmed from many addresses. The window is short on purpose — a burst of genuine interest in a
 * freshly published lesson should be slowed, not turned away.
 */
const PER_PATH_LIMIT = 6
const PER_PATH_WINDOW_MS = HOUR_MS

/**
 * Repo-wide ceiling. GitHub's secondary rate limit is 500 content-generating requests per hour per
 * authenticated identity, and every proposal spends roughly four of them (create the branch, write
 * the blob, commit, open the pull request). 60 creations/hour is ~240 requests: under half the
 * installation's budget, so the rest of the app's writes still get through, and low enough that one
 * burst cannot spend the whole hour and leave every other contributor failing.
 */
const GLOBAL_LIMIT = 60
const GLOBAL_WINDOW_MS = HOUR_MS

/** The widest window any quota looks at; bounds the rows a check has to scan. */
const WIDEST_WINDOW_MS = Math.max(ANONYMOUS_WINDOW_MS, SIGNED_IN_WINDOW_MS, PER_PATH_WINDOW_MS, GLOBAL_WINDOW_MS)

const ANONYMOUS_MESSAGE = 'This network has reached its limit for edit suggestions. Try again later, or sign in'
const SIGNED_IN_MESSAGE = 'You have reached your limit for edit suggestions. Please try again later'
const PER_PATH_MESSAGE = 'This lesson has too many open edit suggestions right now. Please try again later'
const GLOBAL_MESSAGE = 'We are receiving a lot of edit suggestions right now. Please try again shortly'

export interface ProposalQuotaInput {
  door: ProposalDoor
  ipHash: string | null
  privyUserId: string | null
  path: string
}

export interface ProposalRecordInput {
  id: string
  path: string
  branch: string
  prNumber: number
  door: ProposalDoor
  ipHash: string | null
  privyUserId: string | null
  licenseVersion: string
  licenseAcceptedAt: Date
}

interface QuotaWindow {
  count: number
  oldest: Date | null
}

/** Milliseconds until the window's oldest row ages out, which is when a slot actually frees up. */
function retryAfterMs(window: QuotaWindow, windowMs: number, now: Date): number {
  const freesAt = (window.oldest?.getTime() ?? now.getTime()) + windowMs
  return Math.max(freesAt - now.getTime(), 0)
}

async function getWindows(input: ProposalQuotaInput, now: Date) {
  // The `postgres` driver doesn't serialize Date objects inside sql template params,
  // so we bind ISO strings and cast them to timestamp in the query.
  const scanCutoffIso = new Date(now.getTime() - WIDEST_WINDOW_MS).toISOString()
  const anonymousCutoffIso = new Date(now.getTime() - ANONYMOUS_WINDOW_MS).toISOString()
  const signedInCutoffIso = new Date(now.getTime() - SIGNED_IN_WINDOW_MS).toISOString()
  const pathCutoffIso = new Date(now.getTime() - PER_PATH_WINDOW_MS).toISOString()
  const globalCutoffIso = new Date(now.getTime() - GLOBAL_WINDOW_MS).toISOString()

  // Empty string as the key when the door doesn't supply one: no row can carry it, so that bucket
  // counts zero instead of the driver having to bind an untyped NULL into an equality.
  const ipHash = input.ipHash ?? ''
  const privyUserId = input.privyUserId ?? ''

  // One round-trip for all four quotas. The global ceiling already bounds the outer scan to roughly
  // GLOBAL_LIMIT * 24 rows, so conditional aggregates cost less here than four separate queries.
  const [row] = await db
    .select({
      anonymousCount:
        sql<number>`COUNT(*) FILTER (WHERE ${contentProposals.door} = 'anonymous' AND ${contentProposals.ipHash} = ${ipHash} AND ${contentProposals.createdAt} > ${anonymousCutoffIso})`.mapWith(
          Number,
        ),
      anonymousOldest: sql<Date | null>`MIN(${contentProposals.createdAt}) FILTER (WHERE ${contentProposals.door} = 'anonymous' AND ${contentProposals.ipHash} = ${ipHash} AND ${contentProposals.createdAt} > ${anonymousCutoffIso})`,
      signedInCount:
        sql<number>`COUNT(*) FILTER (WHERE ${contentProposals.door} = 'signed_in' AND ${contentProposals.privyUserId} = ${privyUserId} AND ${contentProposals.createdAt} > ${signedInCutoffIso})`.mapWith(
          Number,
        ),
      signedInOldest: sql<Date | null>`MIN(${contentProposals.createdAt}) FILTER (WHERE ${contentProposals.door} = 'signed_in' AND ${contentProposals.privyUserId} = ${privyUserId} AND ${contentProposals.createdAt} > ${signedInCutoffIso})`,
      pathCount:
        sql<number>`COUNT(*) FILTER (WHERE ${contentProposals.path} = ${input.path} AND ${contentProposals.createdAt} > ${pathCutoffIso})`.mapWith(
          Number,
        ),
      pathOldest: sql<Date | null>`MIN(${contentProposals.createdAt}) FILTER (WHERE ${contentProposals.path} = ${input.path} AND ${contentProposals.createdAt} > ${pathCutoffIso})`,
      globalCount: sql<number>`COUNT(*) FILTER (WHERE ${contentProposals.createdAt} > ${globalCutoffIso})`.mapWith(
        Number,
      ),
      globalOldest: sql<Date | null>`MIN(${contentProposals.createdAt}) FILTER (WHERE ${contentProposals.createdAt} > ${globalCutoffIso})`,
    })
    .from(contentProposals)
    .where(gt(contentProposals.createdAt, sql`${scanCutoffIso}::timestamp`))

  const window = (count: number | undefined, oldest: Date | null | undefined): QuotaWindow => ({
    count: count ?? 0,
    oldest: oldest ? new Date(oldest) : null,
  })

  return {
    anonymous: window(row?.anonymousCount, row?.anonymousOldest),
    signedIn: window(row?.signedInCount, row?.signedInOldest),
    path: window(row?.pathCount, row?.pathOldest),
    global: window(row?.globalCount, row?.globalOldest),
  }
}

export const ProposalsRepository = {
  /**
   * Throws on the first quota the submission would break. Anonymous submissions open a real pull
   * request with no moderation step in between, so these counts are the only thing rationing write
   * access to the repository.
   */
  async assertWithinQuotas(input: ProposalQuotaInput): Promise<void> {
    const now = new Date()
    const windows = await getWindows(input, now)

    // Contributor-scoped quotas first: when someone is over their own allowance, that is the
    // accurate explanation, and it avoids reporting the shared quotas' state to whoever is exhausting them.
    if (input.door === 'anonymous' && windows.anonymous.count >= ANONYMOUS_LIMIT) {
      throw new AppError(429, ANONYMOUS_MESSAGE, {
        retryAfterMs: retryAfterMs(windows.anonymous, ANONYMOUS_WINDOW_MS, now),
      })
    }

    if (input.door === 'signed_in' && windows.signedIn.count >= SIGNED_IN_LIMIT) {
      throw new AppError(429, SIGNED_IN_MESSAGE, {
        retryAfterMs: retryAfterMs(windows.signedIn, SIGNED_IN_WINDOW_MS, now),
      })
    }

    if (windows.path.count >= PER_PATH_LIMIT) {
      throw new AppError(429, PER_PATH_MESSAGE, {
        retryAfterMs: retryAfterMs(windows.path, PER_PATH_WINDOW_MS, now),
      })
    }

    if (windows.global.count >= GLOBAL_LIMIT) {
      throw new AppError(429, GLOBAL_MESSAGE, {
        retryAfterMs: retryAfterMs(windows.global, GLOBAL_WINDOW_MS, now),
      })
    }
  },

  /** The audit row, and the only counter the quotas above read. Written after the pull request exists. */
  async record(input: ProposalRecordInput): Promise<void> {
    await db.insert(contentProposals).values(input)
  },
}
