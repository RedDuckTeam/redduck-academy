import { Octokit } from '@octokit/rest'
import { AppError } from '../../lib/errors'
import { Logger } from '../../lib/logger'
import { env } from '../../env'
import type { FetchExpectedFilesResult, RepoFile, ResolvedRepoRef } from './types/github'
import { httpStatus, parseGitHubRepoUrl, throwGitHubApiError } from './utils/github'
import { expandReviewPatterns } from './utils/review-paths'

const logger = new Logger('GitHubService')

/** Max bytes per file before decoding (decimal 70 KB; GitHub `size` is in bytes). */
export const MAX_REVIEW_FILE_BYTES = 70_000

/** Max aggregated bytes across all fetched files for one submission (decimal 500 KB). */
export const MAX_REVIEW_TOTAL_BYTES = 500_000

export type { FetchExpectedFilesResult, ParsedGitHubRepoUrl, RepoFile, ResolvedRepoRef } from './types/github'
export { parseGitHubRepoUrl } from './utils/github'

export class GitHubService {
  private readonly octokit: Octokit

  constructor(authToken: string = env.GITHUB_TOKEN) {
    this.octokit = new Octokit({ auth: authToken })
  }

  private async resolveRefToSha(owner: string, repo: string, ref: string): Promise<string> {
    try {
      const { data } = await this.octokit.repos.getBranch({ owner, repo, branch: ref })
      return data.commit.sha
    } catch (e) {
      if (httpStatus(e) === 404) {
        try {
          const { data } = await this.octokit.git.getCommit({
            owner,
            repo,
            commit_sha: ref,
          })
          return data.sha
        } catch {
          throwGitHubApiError(e)
        }
      }
      throwGitHubApiError(e)
    }
  }

  /**
   * Resolve which git ref to pin: explicit ref from URL, otherwise the repository default branch.
   */
  async resolveRepoRef(owner: string, repo: string, refFromUrl: string | undefined): Promise<ResolvedRepoRef> {
    if (refFromUrl) {
      const commitSha = await this.resolveRefToSha(owner, repo, refFromUrl)
      return { commitSha, resolvedRef: refFromUrl }
    }

    try {
      const { data } = await this.octokit.repos.get({ owner, repo })
      const branch = data.default_branch
      const commitSha = await this.resolveRefToSha(owner, repo, branch)
      return { commitSha, resolvedRef: branch }
    } catch (e) {
      throwGitHubApiError(e)
    }
  }

  /**
   * When `templateRepoUrl` is set on the lesson, require a GitHub **fork** whose `source` matches that template.
   * Uses the root of the fork network (`source`) so nested forks still count if they trace back to the template.
   */
  async assertRepoIsForkOfTemplate(submissionRepoUrl: string, templateRepoUrl: string): Promise<void> {
    const submitted = parseGitHubRepoUrl(submissionRepoUrl)
    const template = parseGitHubRepoUrl(templateRepoUrl)
    const expectedFullName = repoFullName(template.owner, template.repo)

    if (repoFullName(submitted.owner, submitted.repo).toLowerCase() === expectedFullName.toLowerCase()) {
      throw new AppError(
        400,
        "Submit your fork of the repository, not the original. Use GitHub's Fork button on the template repo, then paste your fork's URL.",
      )
    }

    let data: { fork: boolean; source?: { full_name?: string } | null }
    try {
      const res = await this.octokit.repos.get({ owner: submitted.owner, repo: submitted.repo })
      data = res.data
    } catch (e) {
      throwGitHubApiError(e)
    }

    if (!data.fork) {
      throw new AppError(
        400,
        "This repository is not a GitHub fork. Fork the course template with the Fork button, work in your fork, then submit your fork's URL.",
      )
    }

    const sourceFullName = data.source?.full_name?.toLowerCase()
    if (!sourceFullName || sourceFullName !== expectedFullName.toLowerCase()) {
      const upstream = data.source?.full_name ?? 'unknown'
      throw new AppError(
        400,
        `This repository is a fork of "${upstream}", but this lesson only accepts forks of "${expectedFullName}".`,
      )
    }
  }

  async listBlobPathsAtCommit(owner: string, repo: string, commitSha: string): Promise<string[]> {
    try {
      const { data: commitObj } = await this.octokit.git.getCommit({
        owner,
        repo,
        commit_sha: commitSha,
      })
      const { data: tree } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: commitObj.tree.sha,
        recursive: 'true',
      })
      return (tree.tree ?? [])
        .filter((e) => e.type === 'blob' && e.path)
        .map((e) => e.path as string)
        .sort()
    } catch (e) {
      throwGitHubApiError(e)
    }
  }

  /**
   * Fetches a single text file at ref. Enforces `maxBytes` using GitHub `size` before base64 decode;
   * if inline `content` is omitted (some large files), downloads via `download_url` only when `size <= maxBytes`.
   */
  async getTextFileAtRef(
    owner: string,
    repo: string,
    path: string,
    ref: string,
    maxBytes: number = MAX_REVIEW_FILE_BYTES,
  ): Promise<string | null> {
    const result = await this.#getFileContentForReview(owner, repo, path, ref, maxBytes)
    if (result.type === 'ok') {
      return result.content
    }
    return null
  }

  async #getFileContentForReview(
    owner: string,
    repo: string,
    path: string,
    ref: string,
    maxBytes: number,
  ): Promise<{ type: 'ok'; content: string } | { type: 'missing' } | { type: 'oversized'; sizeBytes: number }> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      })
      if (Array.isArray(data)) {
        return { type: 'missing' }
      }
      if (data.type !== 'file') {
        return { type: 'missing' }
      }

      const reportedSize = typeof data.size === 'number' ? data.size : null
      if (reportedSize !== null && reportedSize > maxBytes) {
        return { type: 'oversized', sizeBytes: reportedSize }
      }

      if (typeof data.content === 'string' && data.content.length > 0) {
        const buf = Buffer.from(data.content, 'base64')
        if (buf.byteLength > maxBytes) {
          return { type: 'oversized', sizeBytes: buf.byteLength }
        }
        return { type: 'ok', content: buf.toString('utf-8') }
      }

      // Large files: JSON may omit `content` but include `size` and `download_url`.
      if (reportedSize !== null && reportedSize <= maxBytes && data.download_url) {
        const buf = await this.#fetchAuthenticatedDownload(data.download_url)
        if (buf.byteLength > maxBytes) {
          return { type: 'oversized', sizeBytes: buf.byteLength }
        }
        return { type: 'ok', content: Buffer.from(buf).toString('utf-8') }
      }

      return { type: 'missing' }
    } catch (e) {
      if (httpStatus(e) === 404) {
        return { type: 'missing' }
      }
      throwGitHubApiError(e)
    }
  }

  /** Follows redirects; uses token for private repos / API raw URLs. */
  async #fetchAuthenticatedDownload(downloadUrl: string): Promise<ArrayBuffer> {
    const res = await fetch(downloadUrl, {
      redirect: 'follow',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'redduck-academy-backend',
      },
    })
    if (!res.ok) {
      logger.error('Authenticated raw download failed', undefined, { status: res.status, downloadUrl })
      throw new AppError(502, 'Could not download a file from GitHub, please try again later')
    }
    return res.arrayBuffer()
  }

  /**
   * Fetch expected paths from the repo URL the user submitted. Ref (branch / tag / commit) is taken from the URL when present; otherwise the default branch is used.
   * Missing paths are listed in `missingPaths`.
   */
  async fetchExpectedFilesFromRepoUrl(repoUrl: string, expectedPaths: string[]): Promise<FetchExpectedFilesResult> {
    const { owner, repo, refFromUrl } = parseGitHubRepoUrl(repoUrl)
    const { commitSha, resolvedRef } = await this.resolveRepoRef(owner, repo, refFromUrl)

    const fileTreePaths = await this.listBlobPathsAtCommit(owner, repo, commitSha)

    const { concretePaths, missingPatterns } = expandReviewPatterns(expectedPaths, fileTreePaths)

    const files: RepoFile[] = []
    const missingPaths: string[] = [...missingPatterns]
    const oversizedPaths: { path: string; sizeBytes: number }[] = []
    let totalBytes = 0

    for (const path of concretePaths) {
      const result = await this.#getFileContentForReview(owner, repo, path, commitSha, MAX_REVIEW_FILE_BYTES)
      if (result.type === 'missing') {
        missingPaths.push(path)
      } else if (result.type === 'oversized') {
        oversizedPaths.push({ path, sizeBytes: result.sizeBytes })
      } else {
        const fileBytes = Buffer.byteLength(result.content, 'utf-8')
        if (totalBytes + fileBytes > MAX_REVIEW_TOTAL_BYTES) {
          throw new AppError(
            413,
            'Submission is too large to review. Please reduce the total size of the submitted files and try again.',
          )
        }
        totalBytes += fileBytes
        files.push({ path, content: result.content })
      }
    }

    return {
      owner,
      repo,
      commitSha,
      resolvedRef,
      fileTreePaths,
      files,
      missingPaths,
      oversizedPaths,
    }
  }
}

export const githubService = new GitHubService()

function repoFullName(owner: string, repo: string): string {
  return `${owner}/${repo}`
}
