import type { RateLimitReason } from '@/lib/api/rate-limit'

const MONTHLY_FALLBACK = "You've reached your monthly limit for this task"

function formatMonthlyMessage(resetAt: string | null): string {
  if (!resetAt) return MONTHLY_FALLBACK
  const date = new Date(resetAt)
  if (Number.isNaN(date.getTime())) return MONTHLY_FALLBACK
  const formatted = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${MONTHLY_FALLBACK}. Resets on ${formatted}`
}

export function getRateLimitCopy(reason: RateLimitReason | null, resetAt: string | null): string {
  switch (reason) {
    case 'daily':
      return "You're out of attempts for today, come back tomorrow"
    case 'monthly':
      return formatMonthlyMessage(resetAt)
    case 'cooldown':
    default:
      return "Please wait before next submission. You're submitting too fast."
  }
}
