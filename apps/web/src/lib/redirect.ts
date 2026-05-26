import type { AnyRouter } from '@tanstack/react-router'

/**
 * Validate a post-login redirect target. Only same-origin absolute paths are
 * allowed (must start with a single `/`), and we never bounce back into the
 * sign-in page itself. Returns `undefined` for anything unsafe so callers fall
 * back to a default destination.
 */
export function sanitizeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string' || value === '') return undefined
  if (!value.startsWith('/') || value.startsWith('//')) return undefined
  if (value === '/sign-up' || value.startsWith('/sign-up?')) return undefined
  return value
}

/**
 * Send the user where they came from after authenticating, falling back to the
 * dashboard. `redirect` is an already-sanitized relative href; we use the
 * history API so an arbitrary path string navigates cleanly.
 */
export function navigateAfterAuth(router: AnyRouter, redirect?: string): void {
  if (redirect) router.history.replace(redirect)
  else void router.navigate({ to: '/dashboard', replace: true })
}
