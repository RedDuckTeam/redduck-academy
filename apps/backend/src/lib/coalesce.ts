// Singleflight: collapse concurrent calls with the same `key` onto one
// in-flight Promise. Not a cache — the entry is dropped once it settles.

const inflight = new Map<string, Promise<unknown>>()

/**
 * @example
 *   await coalesce('rating', () => UserService.getRating())
 *   await coalesce(`progress-cards:${userId}`, () => UserService.getProgressCards(userId))
 */
export function coalesce<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing

  // Deferred so the inflight entry is registered before fn runs and a sync
  // throw inside fn becomes a rejection.
  const promise: Promise<T> = Promise.resolve()
    .then(fn)
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

export function inflightSize(): number {
  return inflight.size
}
