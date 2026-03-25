export type RepoFile = { path: string; content: string }

export type ParsedGitHubRepoUrl = {
  owner: string
  repo: string
  /** When set, review this ref (branch name, tag, or commit SHA). When absent, use repo default branch. */
  refFromUrl?: string
}

export type OversizedPath = { path: string; sizeBytes: number }

export type FetchExpectedFilesResult = {
  owner: string
  repo: string
  commitSha: string
  resolvedRef: string
  fileTreePaths: string[]
  files: RepoFile[]
  missingPaths: string[]
  /** Paths whose GitHub-reported size exceeds the per-file limit (not fetched). */
  oversizedPaths: OversizedPath[]
}

export type ResolvedRepoRef = {
  commitSha: string
  resolvedRef: string
}
