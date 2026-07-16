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

// Post-login redirect target, carried in sessionStorage instead of the URL. A
// `/sign-up?redirect=<path>` link is a distinct crawlable URL on every page, so Googlebot treats
// each CTA as its own page and burns crawl budget fetching sign-up variants. Keeping the target
// out of the href leaves one `/sign-up` URL and no crawl trap. sessionStorage survives the OAuth
// round-trip (same tab), so the redirect still works for real users.
const POST_AUTH_REDIRECT_KEY = 'redduck:post-auth-redirect'

/** Stash a post-login redirect target for the sign-up page to pick up. Browser-only. */
export function stashRedirect(value: unknown): void {
  if (typeof window === 'undefined') return
  const target = sanitizeRedirect(value)
  try {
    if (target) window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, target)
    else window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
  } catch {
    /* sessionStorage blocked (private mode) — the redirect simply falls back to home */
  }
}

/** Read the stashed redirect without clearing it (it must survive the OAuth round-trip). */
export function peekRedirect(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return sanitizeRedirect(window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY))
  } catch {
    return undefined
  }
}

/** Clear the stashed redirect once it has been consumed. */
export function clearRedirect(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Send the user where they came from after authenticating, falling back to the
 * home page. `redirect` is an already-sanitized relative href; we use the
 * history API so an arbitrary path string navigates cleanly. Clears the stashed
 * target so a later visit to /sign-up doesn't reuse a stale redirect.
 */
export function navigateAfterAuth(router: AnyRouter, redirect?: string): void {
  clearRedirect()
  if (redirect) router.history.replace(redirect)
  else void router.navigate({ to: '/', replace: true })
}
