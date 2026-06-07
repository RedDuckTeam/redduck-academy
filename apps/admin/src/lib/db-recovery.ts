import type { Payload } from 'payload'

/**
 * Recovery for Postgres "too many connections" errors in the admin.
 *
 * On Vercel each warm serverless instance keeps its own `pg.Pool` (max 3),
 * shared against a ~20-connection DB ceiling. Under a burst of SSR renders the
 * ceiling is hit and queries reject with `53300` (too_many_connections) — which,
 * unhandled, blanks the whole admin page. See RESILIENCE-AUDIT.md → C4.
 *
 * `withDbRecovery` wraps a query: on a connection-exhaustion error it drains and
 * rebuilds *this* instance's pool (returning its connections to Postgres so the
 * ceiling clears) and retries once. The pool reset is single-flight, so a burst
 * of failing renders triggers exactly one reset rather than a stampede.
 */

/** Postgres SQLSTATE codes that mean "the server won't give us a connection". */
const EXHAUSTION_SQLSTATES = new Set(['53300', '53400'])

/** Substrings seen on pool/driver-side exhaustion errors that carry no SQLSTATE. */
const EXHAUSTION_MESSAGES = [
  'too many clients',
  'too many connections',
  'remaining connection slots',
  'connection terminated',
  'timeout exceeded when trying to connect',
]

export function isConnectionExhaustionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const code = (err as { code?: unknown }).code
  if (typeof code === 'string' && EXHAUSTION_SQLSTATES.has(code)) return true
  const message = (err as { message?: unknown }).message
  if (typeof message === 'string') {
    const lower = message.toLowerCase()
    return EXHAUSTION_MESSAGES.some((needle) => lower.includes(needle))
  }
  return false
}

/** Minimal structural view of the postgres adapter — avoids importing `pg`. */
interface PoolLike {
  end: () => Promise<void>
}
interface PostgresLikeAdapter {
  pool?: PoolLike
  connect?: (options?: { hotReload: boolean }) => Promise<void>
}

// Single-flight guard: concurrent callers share one in-progress reset.
let recovering: Promise<void> | null = null

/**
 * Drain this instance's connection pool and rebuild it. The adapter's `connect()`
 * lazily recreates `this.pool` (and the drizzle client bound to it) when the pool
 * is nullified, so we end the old pool first — freeing its slots on the server —
 * then let the adapter build a fresh one against the now-cleared ceiling.
 */
export function recoverDbPool(payload: Payload): Promise<void> {
  if (recovering) return recovering

  recovering = (async () => {
    const adapter = payload.db as unknown as PostgresLikeAdapter
    const stalePool = adapter.pool
    // Detach the old pool so any new query goes through a rebuilt one.
    adapter.pool = undefined
    if (stalePool) {
      try {
        await stalePool.end()
      } catch {
        // Already ending/ended — its sockets are being released regardless.
      }
    }
    if (typeof adapter.connect === 'function') {
      await adapter.connect({ hotReload: false })
    }
  })().finally(() => {
    recovering = null
  })

  return recovering
}

/**
 * Run a DB operation; if it fails because the connection pool is exhausted,
 * drain+rebuild the pool once and retry. Any other error (and a still-failing
 * retry) propagates to the caller so the UI can show its own fallback.
 */
export async function withDbRecovery<T>(payload: Payload, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (!isConnectionExhaustionError(err)) throw err
    payload.logger.error(
      { err },
      'Postgres connection pool exhausted — draining admin pool and retrying',
    )
    await recoverDbPool(payload)
    return fn()
  }
}
