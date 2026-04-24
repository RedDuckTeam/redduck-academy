/**
 * Small NestJS-style logger. One instance per service (or per sub-system).
 *
 *   const logger = new Logger('ReviewService')
 *   logger.error('Failed to create OpenAI batch', err, { submissionId })
 *
 * Only `.error()` is wired up today — add other levels if/when we need them.
 */

type ErrorMeta = Record<string, unknown>

const LEVEL_ERROR = 'ERROR'

function formatTimestamp(): string {
  return new Date().toISOString()
}

function formatMeta(meta: ErrorMeta | undefined): string {
  if (!meta || Object.keys(meta).length === 0) return ''
  try {
    return ` ${JSON.stringify(meta)}`
  } catch {
    return ''
  }
}

function formatError(err: unknown): string {
  if (err === undefined || err === null) return ''
  if (err instanceof Error) {
    const name = err.name || 'Error'
    const stack = err.stack ? `\n${err.stack}` : ''
    const cause = (err as { cause?: unknown }).cause
    const causeStr = cause ? `\n  caused by: ${formatError(cause)}` : ''
    return `\n  ↳ ${name}: ${err.message}${stack}${causeStr}`
  }
  try {
    return `\n  ↳ ${JSON.stringify(err)}`
  } catch {
    return `\n  ↳ ${String(err)}`
  }
}

export class Logger {
  constructor(private readonly context: string) {}

  /**
   * Log an error with the service context, an optional underlying error, and optional structured metadata.
   * Meant for the `catch` side of an external call / invariant violation — the caller is still responsible
   * for deciding what (sanitized) error to return to the client.
   */
  error(message: string, error?: unknown, meta?: ErrorMeta): void {
    const prefix = `[${formatTimestamp()}] [${LEVEL_ERROR}] [${this.context}]`
    // eslint-disable-next-line no-console
    console.error(`${prefix} ${message}${formatMeta(meta)}${formatError(error)}`)
  }
}
