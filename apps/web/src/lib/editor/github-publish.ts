// This hands off to GitHub's own file editor (which forks automatically for a visitor with no
// write access) rather than calling an API — everything here is a public GET or a plain link.

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

export function lessonFilePath(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `content/${courseSlug}/${moduleSlug}/${lessonSlug}.md`
}

/** GitHub's file editor. For a visitor without write access it forks the repo on first commit. */
export function githubEditUrl(path: string): string {
  return `https://github.com/${OWNER}/${REPO}/edit/${BRANCH}/${encodeURI(path)}`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {}

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
