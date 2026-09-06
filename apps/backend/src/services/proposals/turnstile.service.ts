import { AppError } from '../../lib/errors'
import { Logger } from '../../lib/logger'
import { allowedTurnstileHostnames, turnstileSecret } from './proposals.config'

const logger = new Logger('TurnstileService')

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** The widget renders with this action, so a token solved elsewhere on the site cannot be spent here. */
const EXPECTED_ACTION = 'submit-proposal'

/** Cloudflare's own failure. It does not spend the token, so the same one may be presented again. */
const INTERNAL_ERROR_CODE = 'internal-error'

/** Tokens are single-use; seeing one twice is a replay, not a mistake the contributor can correct. */
const REPLAY_CODE = 'timeout-or-duplicate'

/** One call plus one retry. More would only lengthen the request while Cloudflare is already down. */
const MAX_VERIFY_ATTEMPTS = 2
const RETRY_DELAY_MS = 250
const REQUEST_TIMEOUT_MS = 5_000

const CHALLENGE_FAILED = 'We could not verify that challenge. Please complete it again and resubmit'
const CHALLENGE_SPENT = 'That challenge has already been used. Please complete a new one and resubmit'
const UNAVAILABLE = 'We could not check the challenge just now. Please try again in a moment'

interface SiteVerifyResponse {
  success: boolean
  hostname?: string
  action?: string
  'error-codes'?: string[]
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function siteVerify(secret: string, token: string, remoteIp: string): Promise<SiteVerifyResponse> {
  const body = new URLSearchParams({ secret, response: token })
  // `remoteip` is optional, and '' is not an address — sending it would be a malformed parameter.
  if (remoteIp) body.set('remoteip', remoteIp)

  let response: Response
  try {
    response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    // An unreachable verifier is our outage, not a failed challenge. Anything other than throwing
    // here reduces to "captcha off", which on this route is unauthenticated write access to the repo.
    logger.error('Turnstile siteverify request failed', err)
    throw new AppError(503, UNAVAILABLE)
  }

  if (!response.ok) {
    logger.error('Turnstile siteverify returned a non-OK status', undefined, { status: response.status })
    throw new AppError(503, UNAVAILABLE)
  }

  try {
    return (await response.json()) as SiteVerifyResponse
  } catch (err) {
    logger.error('Turnstile siteverify returned an unreadable body', err)
    throw new AppError(503, UNAVAILABLE)
  }
}

export const TurnstileService = {
  /** Resolves only for a fresh, unspent solve of our widget, on one of our hostnames, from this form. */
  async verify(token: string, remoteIp: string): Promise<void> {
    if (!token) throw new AppError(400, CHALLENGE_FAILED)

    const secret = turnstileSecret()

    let result = await siteVerify(secret, token, remoteIp)
    for (let attempt = 1; attempt < MAX_VERIFY_ATTEMPTS; attempt++) {
      if (result.success || !result['error-codes']?.includes(INTERNAL_ERROR_CODE)) break
      // The token survives `internal-error`, so the retry re-presents the same one. Handing the
      // failure back to the client instead would ask it to resubmit a token it has already used,
      // which returns `timeout-or-duplicate` every time and strands an honest contributor.
      await delay(RETRY_DELAY_MS)
      result = await siteVerify(secret, token, remoteIp)
    }

    if (!result.success) {
      const codes = result['error-codes'] ?? []

      if (codes.includes(INTERNAL_ERROR_CODE)) {
        logger.error('Turnstile siteverify kept failing internally', undefined, { codes })
        throw new AppError(503, UNAVAILABLE)
      }

      if (codes.includes(REPLAY_CODE)) {
        logger.error('Turnstile token replayed', undefined, { codes })
        throw new AppError(400, CHALLENGE_SPENT)
      }

      throw new AppError(400, CHALLENGE_FAILED)
    }

    // The sitekey is public and Cloudflare mints tokens for it on every hostname the widget allows,
    // so `success` alone only proves that somebody solved some widget somewhere. These two checks are
    // what actually bind the token to our origin and to this form; without them a token minted on any
    // other permitted host is accepted here.
    const hostname = result.hostname ?? ''
    if (!allowedTurnstileHostnames().includes(hostname)) {
      logger.error('Turnstile token solved on an unexpected hostname', undefined, { hostname })
      throw new AppError(400, CHALLENGE_FAILED)
    }

    if (result.action !== EXPECTED_ACTION) {
      logger.error('Turnstile token carried an unexpected action', undefined, { action: result.action })
      throw new AppError(400, CHALLENGE_FAILED)
    }
  },
}
