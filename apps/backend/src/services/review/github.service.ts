import { Octokit } from '@octokit/rest'
import { env } from '../../env'
import type { FetchExpectedFilesResult, RepoFile, ResolvedRepoRef } from './types/github'
import { httpStatus, parseGitHubRepoUrl, toGitHubApiError } from './utils/github'

/** Max bytes per file before decoding (decimal 1 MB; GitHub `size` is in bytes). */
export const MAX_REVIEW_FILE_BYTES = 1_000_000

export type { FetchExpectedFilesResult, ParsedGitHubRepoUrl, RepoFile, ResolvedRepoRef } from './types/github'
export { GitHubApiError, GitHubUrlError } from './errors/github'
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
          throw toGitHubApiError(e)
        }
      }
      throw toGitHubApiError(e)
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
      throw toGitHubApiError(e)
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
      throw toGitHubApiError(e)
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
      throw toGitHubApiError(e)
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
      throw new Error(`Failed to download file from GitHub (${res.status})`)
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

    const files: RepoFile[] = []
    const missingPaths: string[] = []
    const oversizedPaths: { path: string; sizeBytes: number }[] = []

    for (const path of expectedPaths) {
      const result = await this.#getFileContentForReview(owner, repo, path, commitSha, MAX_REVIEW_FILE_BYTES)
      if (result.type === 'missing') {
        missingPaths.push(path)
      } else if (result.type === 'oversized') {
        oversizedPaths.push({ path, sizeBytes: result.sizeBytes })
      } else {
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
