const SIGN_IN_PROMPT_DISMISSED_KEY = 'redduck:sign-in-prompt-dismissed'

/**
 * Session-scoped suppression for the lecture "sign in to save your progress"
 * nudge. Once a logged-out learner dismisses it (or continues without an
 * account), we don't prompt again for the rest of the browser session — a fresh
 * session gives them one new, low-pressure reminder.
 *
 * Backed by `sessionStorage` (not React state, which resets when the lesson
 * route remounts; nor `localStorage`, which would suppress across sessions).
 * Read/written from event handlers, so there's no SSR/hydration concern.
 */
export function isSignInPromptDismissed(): boolean {
  try {
    return sessionStorage.getItem(SIGN_IN_PROMPT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissSignInPrompt(): void {
  try {
    sessionStorage.setItem(SIGN_IN_PROMPT_DISMISSED_KEY, '1')
  } catch {
    /* private mode / storage disabled — fall back to prompting again */
  }
}
