import { eq, gt, sql } from 'drizzle-orm'
import { db } from '../../db'

/** The database handle or a transaction — the quota reads run inside one, the rest do not. */
type Queryable = typeof db | Parameters<Parameters<(typeof db)['transaction']>[0]>[0]
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
/**
 * Advisory lock id for the reservation transaction. An arbitrary constant — it only has to be
 * unique among the advisory locks this application takes, and this is the only one.
 */
const RESERVATION_LOCK_ID = 8_417_233

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

export interface ProposalReserveInput extends ProposalQuotaInput {
  id: string
  branch: string
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

async function getWindows(tx: Queryable, input: ProposalQuotaInput, now: Date) {
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
  const [row] = await tx
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

function contributorLimit(door: ProposalDoor): { limit: number; windowMs: number } {
  return door === 'anonymous'
    ? { limit: ANONYMOUS_LIMIT, windowMs: ANONYMOUS_WINDOW_MS }
    : { limit: SIGNED_IN_LIMIT, windowMs: SIGNED_IN_WINDOW_MS }
}

/** Reported once a reservation is refused, so the contributor learns which limit they met. */
async function refusal(tx: Queryable, input: ProposalQuotaInput, now: Date): Promise<never> {
  const windows = await getWindows(tx, input, now)
  const contributor = input.door === 'anonymous' ? windows.anonymous : windows.signedIn
  const { limit, windowMs } = contributorLimit(input.door)

  if (contributor.count >= limit) {
    const message = input.door === 'anonymous' ? ANONYMOUS_MESSAGE : SIGNED_IN_MESSAGE
    throw new AppError(429, message, { retryAfterMs: retryAfterMs(contributor, windowMs, now) })
  }
  if (windows.path.count >= PER_PATH_LIMIT) {
    throw new AppError(429, PER_PATH_MESSAGE, { retryAfterMs: retryAfterMs(windows.path, PER_PATH_WINDOW_MS, now) })
  }
  throw new AppError(429, GLOBAL_MESSAGE, { retryAfterMs: retryAfterMs(windows.global, GLOBAL_WINDOW_MS, now) })
}

export const ProposalsRepository = {
  /**
   * Claims a quota slot, or refuses with a 429.
   *
   * The row is written here — before any GitHub call — rather than after the pull request exists,
   * because a check that only reads is not a limit. Opening a proposal takes several seconds and
   * seven GitHub round-trips; with the row written at the end, a burst fired inside that window has
   * every request read a count of zero, pass all four quotas and open a pull request each.
   *
   * Counting and inserting inside one advisory-locked transaction is what makes the limit exact.
   * A conditional INSERT alone is not enough: under READ COMMITTED each statement counts against
   * its own snapshot, so simultaneous submissions all see the same total and overshoot — measured
   * at 6 admitted against a limit of 5 in a 50-way burst. Serialising costs nothing at a ceiling of
   * 60 proposals an hour, and the lock is held only for two counts and an insert.
   *
   * `prNumber` stays null until `attachPullRequest`, and `release` removes the row if the
   * submission never gets that far, so a failed attempt does not consume the contributor's day.
   */
  async reserve(input: ProposalReserveInput): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${RESERVATION_LOCK_ID})`)

      const now = new Date()
      const windows = await getWindows(tx, input, now)
      const contributor = input.door === 'anonymous' ? windows.anonymous : windows.signedIn
      const { limit } = contributorLimit(input.door)

      if (contributor.count >= limit || windows.path.count >= PER_PATH_LIMIT || windows.global.count >= GLOBAL_LIMIT) {
        await refusal(tx, input, now)
      }

      await tx.insert(contentProposals).values({
        id: input.id,
        path: input.path,
        branch: input.branch,
        door: input.door,
        ipHash: input.ipHash,
        privyUserId: input.privyUserId,
        licenseVersion: input.licenseVersion,
        licenseAcceptedAt: input.licenseAcceptedAt,
      })
    })
  },

  /** Completes a reservation once the pull request exists. */
  async attachPullRequest(id: string, prNumber: number): Promise<void> {
    await db.update(contentProposals).set({ prNumber }).where(eq(contentProposals.id, id))
  },

  /** Gives the slot back when a submission fails before a pull request was opened. */
  async release(id: string): Promise<void> {
    await db.delete(contentProposals).where(eq(contentProposals.id, id))
  },
}
