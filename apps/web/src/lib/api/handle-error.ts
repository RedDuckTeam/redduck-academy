import { toast } from 'sonner'
import { ApiError, ValidationError, type ValidationIssue } from './errors'
import { RateLimitError } from './rate-limit'

interface HandleApiErrorOptions {
  /** Override the toast title (defaults to derived from the error). */
  title?: string
  /** Skip toasting (useful when the caller wants to handle the error inline). */
  silent?: boolean
  /** Fallback message for non-ApiError throwables. */
  fallback?: string
}

const formatIssuePath = (issue: ValidationIssue): string => {
  if (!issue.path?.length) return ''
  return issue.path
    .map((segment) => (typeof segment === 'object' ? segment.key : segment))
    .join('.')
}

const buildValidationMessage = (err: ValidationError): string => {
  if (err.issues.length === 1) {
    const [only] = err.issues
    const path = formatIssuePath(only)
    return path ? `${path}: ${only.message}` : only.message
  }
  return err.issues
    .map((issue) => {
      const path = formatIssuePath(issue)
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join('\n')
}

export function handleApiError(err: unknown, options: HandleApiErrorOptions = {}): void {
  if (options.silent) return

  if (err instanceof RateLimitError) {
    toast.error(err.message)
    return
  }

  if (err instanceof ValidationError) {
    toast.error(options.title ?? 'Please check the form', {
      description: buildValidationMessage(err),
    })
    return
  }

  if (err instanceof ApiError) {
    if (err.status === 401) return // handled by auth flow elsewhere
    toast.error(options.title ?? err.message)
    return
  }

  if (err instanceof Error) {
    toast.error(options.title ?? err.message ?? options.fallback ?? 'Something went wrong')
    return
  }

  toast.error(options.fallback ?? 'Something went wrong')
}
