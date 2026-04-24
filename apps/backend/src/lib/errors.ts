export class AppError extends Error {
  readonly statusCode: number
  readonly extra?: Record<string, unknown>

  constructor(statusCode: number, message: string, extra?: Record<string, unknown>) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.extra = extra
  }
}

/**
 * Default user-facing copy for any failure we don't want to describe in detail
 * (third-party outages, unexpected parsing issues, infra errors, etc.).
 * Details go to the server log; the client gets this string.
 */
export const GENERIC_ERROR_MESSAGE = 'Something went wrong, please try again later'
