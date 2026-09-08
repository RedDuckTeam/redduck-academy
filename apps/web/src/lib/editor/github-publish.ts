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
