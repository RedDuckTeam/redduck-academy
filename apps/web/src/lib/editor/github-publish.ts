// The publish step is a hand-off, not an API call: GitHub's own file editor already does
// fork-and-pull-request for a visitor with no write access, so the editor's last act is to put the
// finished file on the clipboard and send them there. Nothing below needs a token, an endpoint or
// a captcha — everything is either a public GET or a plain link.

/**
 * The canonical owner. `git remote` still names the org's former spelling, `RedDuck-Software`,
 * which GitHub 301s on every route used here — harmless, but it costs a redirect on the one link
 * the whole hand-off depends on, so the current name is used directly.
 */
const OWNER = 'RedDuckTeam'
const REPO = 'redduck-academy'
const BRANCH = 'main'

export const CONTENT_REPO_LABEL = `${OWNER}/${REPO}`
export const CONTENT_REPO_URL = `https://github.com/${OWNER}/${REPO}`

/** Where the lesson lives in the repository, e.g. `content/basics/crypto/hashing.md`. */
export function lessonFilePath(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `content/${courseSlug}/${moduleSlug}/${lessonSlug}.md`
}

/** GitHub's file editor. For a visitor without write access it forks the repo on first commit. */
export function githubEditUrl(path: string): string {
  return `https://github.com/${OWNER}/${REPO}/edit/${BRANCH}/${encodeURI(path)}`
}

/**
 * GitHub's new-file editor. `value` prefills the body; it is dropped when the resulting URL would
 * be over budget — see `PREFILL_URL_LIMIT`, and `prefillFits` for the decision.
 */
export function githubNewFileUrl(path: string, value?: string): string {
  // `encodeURIComponent`, not `URLSearchParams`: the latter writes a space as `+`, which is only a
  // space to a form-encoded parser. Prose is full of spaces and a literal `+` in every gap would be
  // a corrupted file with no obvious cause.
  const query = `filename=${encodeURIComponent(path)}`
  const body = value === undefined ? '' : `&value=${encodeURIComponent(value)}`
  return `https://github.com/${OWNER}/${REPO}/new/${BRANCH}?${query}${body}`
}

/**
 * Measured against github.com, not guessed: their edge answers 414 from about 8,200 URL characters,
 * and a logged-out contributor breaks earlier still (~7,000) because the redirect to /login wraps
 * the whole URL into a re-encoded `return_to`. Markdown percent-encodes to roughly 1.5x its size,
 * so this fits a file of about 4 KB — a new lesson from the template, not a finished one.
 */
export const PREFILL_URL_LIMIT = 6000

export function prefillFits(path: string, value: string): boolean {
  return githubNewFileUrl(path, value).length <= PREFILL_URL_LIMIT
}

export type PublishedFile = { status: 'found'; text: string } | { status: 'missing' }

/**
 * The file as it stands on `main` right now, read straight from raw.githubusercontent.com — public,
 * unauthenticated, `access-control-allow-origin: *`. This is the freshness check: the editor loads
 * from the deployed `/_content/**.md` assets, which lag `main` by a deploy, and pasting a stale
 * buffer into GitHub's editor is how a merged change gets silently reverted.
 *
 * The CDN caches for five minutes, so a change merged in the last few minutes can be missed. That
 * is the residual risk of not spending an API quota here; the pull request still shows the truth.
 */
export async function fetchPublishedFile(path: string, signal?: AbortSignal): Promise<PublishedFile> {
  const response = await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${encodeURI(path)}`, {
    cache: 'no-store',
    signal,
  })
  if (response.status === 404) return { status: 'missing' }
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`)
  return { status: 'found', text: await response.text() }
}

/**
 * Resolves only when the text is genuinely on the clipboard. The async API is refused outside a
 * user gesture, in a cross-origin iframe and — in Chrome — whenever the document has lost focus, so
 * the `execCommand` path stays as the fallback it was designed to be. The caller must be able to
 * tell the contributor the truth: the whole hand-off is one clipboard write.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const area = document.createElement('textarea')
    area.value = text
    // Off-screen rather than `display: none` — a hidden element cannot hold a selection. `readOnly`
    // keeps iOS from raising the keyboard behind the dialog.
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0'
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, text.length)
    const copied = document.execCommand('copy')
    area.remove()
    return copied
  } catch {
    return false
  }
}

/** Saves the buffer as a file named after the lesson, for anyone working from a local clone. */
export function downloadMarkdown(path: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = path.slice(path.lastIndexOf('/') + 1)
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoked on the next task: Safari has not finished reading the blob when `click()` returns.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
