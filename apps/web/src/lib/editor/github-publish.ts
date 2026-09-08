// `git remote` still names the org's former spelling, `RedDuck-Software`, which GitHub 301s on every route used here.
const OWNER = 'RedDuckTeam'
const REPO = 'redduck-academy'
const BRANCH = 'main'

export const CONTENT_REPO_LABEL = `${OWNER}/${REPO}`
export const CONTENT_REPO_URL = `https://github.com/${OWNER}/${REPO}`

export function lessonFilePath(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `content/${courseSlug}/${moduleSlug}/${lessonSlug}.md`
}

export function githubEditUrl(path: string): string {
  return `https://github.com/${OWNER}/${REPO}/edit/${BRANCH}/${encodeURI(path)}`
}
