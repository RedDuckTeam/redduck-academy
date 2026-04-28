export interface ValidationIssue {
  message: string
  path?: ReadonlyArray<string | number | { key: string | number }>
}

export class ApiError extends Error {
  readonly status: number
  readonly extra?: Record<string, unknown>

  constructor(message: string, status: number, extra?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.extra = extra
  }
}

export class ValidationError extends ApiError {
  readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[], status = 400) {
    super(issues[0]?.message ?? 'Validation failed', status)
    this.name = 'ValidationError'
    this.issues = issues
  }
}

const GENERIC_MESSAGE = 'Something went wrong, please try again later'

export function parseApiError(status: number, statusText: string, rawBody: string): ApiError {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return new ApiError(rawBody || statusText || GENERIC_MESSAGE, status)
  }

  if (parsed && typeof parsed === 'object') {
    const body = parsed as Record<string, unknown>

    // hono standard-validator validation failures: { success: false, error: [...issues], data }
    if (body.success === false && Array.isArray(body.error)) {
      return new ValidationError(body.error as ValidationIssue[], status)
    }

    if (typeof body.error === 'string') {
      const { error, ...rest } = body
      return new ApiError(error, status, Object.keys(rest).length ? rest : undefined)
    }

    if (typeof body.message === 'string') {
      return new ApiError(body.message, status, body)
    }
  }

  return new ApiError(statusText || GENERIC_MESSAGE, status)
}
