import type { ParsedGitHubRepoUrl } from '../types/github'
import { AppError } from '../../../lib/errors'
import { Logger } from '../../../lib/logger'

const INVALID_REPO_URL = 'Invalid or unsupported GitHub repository URL'

const logger = new Logger('GitHubService')

export function httpStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status: unknown }).status
    return typeof s === 'number' ? s : undefined
  }
  return undefined
}

/**
 * GitHub / Octokit failures.
 *
 * User-visible status codes (404 repo not found, 403 rate-limit, 401 bad token) get mapped to a
 * short, safe message. Everything else becomes a generic 502 — the real error goes to the log only.
 */
export function throwGitHubApiError(err: unknown, context?: Record<string, unknown>): never {
  const status = httpStatus(err)
  logger.error('GitHub API call failed', err, { status, ...context })

  if (status === 404) {
    throw new AppError(404, 'Repository or branch not found on GitHub')
  }
  if (status === 403) {
    throw new AppError(502, 'GitHub rate limit reached, please try again later')
  }
  if (status === 401) {
    throw new AppError(502, 'Could not authenticate with GitHub')
  }
  throw new AppError(502, 'Could not read the repository from GitHub, please try again later')
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
    throw new AppError(400, INVALID_REPO_URL)
  }

  const host = u.hostname.replace(/^www\./i, '')
  if (host !== 'github.com') {
    throw new AppError(400, 'Only github.com URLs are supported')
  }

  const parts = u.pathname.split('/').filter(Boolean)
  if (parts.length < 2) {
    throw new AppError(400, INVALID_REPO_URL)
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
