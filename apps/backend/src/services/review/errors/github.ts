export class GitHubUrlError extends Error {
  readonly code = 'GITHUB_INVALID_URL' as const
  constructor(message = 'Invalid or unsupported GitHub repository URL') {
    super(message)
    this.name = 'GitHubUrlError'
  }
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'GitHubApiError'
  }
}
