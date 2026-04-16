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
