export type RateLimitReason = 'cooldown' | 'daily' | 'monthly'

interface RateLimitErrorParams {
  reason: RateLimitReason | null
  retryAfterMs: number
  resetAt?: string | null
  message?: string
}

export class RateLimitError extends Error {
  reason: RateLimitReason | null
  retryAfterMs: number
  resetAt: string | null

  constructor({ reason, retryAfterMs, resetAt = null, message }: RateLimitErrorParams) {
    super(message ?? 'Too many submissions. Please try again later.')
    this.name = 'RateLimitError'
    this.reason = reason
    this.retryAfterMs = retryAfterMs
    this.resetAt = resetAt
  }
}

export function parseRateLimitReason(value: unknown): RateLimitReason | null {
  return value === 'cooldown' || value === 'daily' || value === 'monthly' ? value : null
}
