import { GitHubApiError, GitHubUrlError } from '../errors/github'
import type { ParsedGitHubRepoUrl } from '../types/github'

export function httpStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status: unknown }).status
    return typeof s === 'number' ? s : undefined
  }
  return undefined
}

export function toGitHubApiError(err: unknown): GitHubApiError {
  if (err instanceof Error) {
    return new GitHubApiError(err.message, httpStatus(err), err)
  }
  return new GitHubApiError(String(err), httpStatus(err), err)
}

/**
 * Parse a user-submitted github.com URL. Branch / tag / commit come from the path when present:
 * - /owner/repo → default branch
 * - /owner/repo/tree/my-branch → ref my-branch (use %2F for slashes in branch names)
 * - /owner/repo/blob/my-branch/path/to/file → ref my-branch
 * - /owner/repo/commit/abc1234 → pinned commit SHA
 */
export function parseGitHubRepoUrl(raw: string): ParsedGitHubRepoUrl {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    throw new GitHubUrlError()
  }

  const host = u.hostname.replace(/^www\./i, '')
  if (host !== 'github.com') {
    throw new GitHubUrlError('Only github.com URLs are supported')
  }

  const parts = u.pathname.split('/').filter(Boolean)
  if (parts.length < 2) {
    throw new GitHubUrlError()
  }

  const owner = parts[0]
  const repo = parts[1].replace(/\.git$/i, '')

  let refFromUrl: string | undefined

  const commitIdx = parts.indexOf('commit')
  if (commitIdx !== -1 && parts[commitIdx + 1]?.match(/^[a-f0-9]{7,40}$/i)) {
    refFromUrl = parts[commitIdx + 1].toLowerCase()
  } else {
    const treeIdx = parts.indexOf('tree')
    if (treeIdx !== -1 && parts[treeIdx + 1]) {
      refFromUrl = decodeURIComponent(parts[treeIdx + 1])
    } else {
      const blobIdx = parts.indexOf('blob')
      if (blobIdx !== -1 && parts[blobIdx + 1]) {
        refFromUrl = decodeURIComponent(parts[blobIdx + 1])
      }
    }
  }

  return { owner, repo, refFromUrl }
}
