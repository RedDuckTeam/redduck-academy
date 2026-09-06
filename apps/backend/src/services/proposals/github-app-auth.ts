import { createSign } from 'crypto'
import { AppError } from '../../lib/errors'
import { Logger } from '../../lib/logger'
import { proposalsRepoConfig } from './proposals.config'

const logger = new Logger('GitHubAppAuth')

/** Same copy as `proposals.config.ts`: a broken App is an outage on our side, not a bad request. */
const UNAVAILABLE = 'Lesson proposals are temporarily unavailable'

/** GitHub rejects an App JWT whose lifetime exceeds ten minutes. */
const JWT_TTL_SECONDS = 540

/** `iat` is validated against GitHub's clock, so it is backdated rather than trusting the dyno's. */
const JWT_BACKDATE_SECONDS = 60

/** Renew this far ahead of `expires_at` so a token cannot lapse partway through a proposal. */
const RENEW_BEFORE_MS = 5 * 60_000

/** Used only when `expires_at` cannot be read; short enough to be safe against any real value. */
const FALLBACK_TTL_MS = 10 * 60_000

function base64url(input: Buffer | string): string {
  return (typeof input === 'string' ? Buffer.from(input, 'utf-8') : input).toString('base64url')
}

function signAppJwt(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({ iat: now - JWT_BACKDATE_SECONDS, exp: now + JWT_TTL_SECONDS, iss: appId }))
  const signature = base64url(createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey))
  return `${header}.${payload}.${signature}`
}

/**
 * Installation access tokens are valid for an hour, so they are held in process memory rather than
 * minted per request. The backend is a long-lived Heroku dyno, which makes an in-process cache both
 * effective and safe: the token dies with the process and is never written anywhere it could outlive
 * it. Nothing here is shared between dynos, which is fine — each simply mints its own.
 */
export class GitHubAppAuth {
  #cached: { token: string; expiresAtMs: number } | null = null
  #minting: Promise<string> | null = null

  async token(): Promise<string> {
    if (this.#cached && Date.now() < this.#cached.expiresAtMs - RENEW_BEFORE_MS) return this.#cached.token

    // A burst of proposals landing on a cold cache shares one mint. Without this every concurrent
    // request signs its own JWT and spends the App's rate limit on authentication alone.
    this.#minting ??= this.#mint().finally(() => {
      this.#minting = null
    })
    return this.#minting
  }

  async #mint(): Promise<string> {
    const { appId, installationId, privateKey } = proposalsRepoConfig()

    try {
      const jwt = signAppJwt(appId, privateKey)

      const res = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'redduck-academy-backend',
        },
      })
      if (!res.ok) {
        throw new Error(`${res.status} ${await res.text().catch(() => '')}`)
      }

      const body = (await res.json()) as { token?: unknown; expires_at?: unknown }
      if (typeof body.token !== 'string') {
        throw new Error('installation token response carried no token')
      }

      const expiresAtMs = typeof body.expires_at === 'string' ? Date.parse(body.expires_at) : NaN
      this.#cached = {
        token: body.token,
        // An unreadable expiry must not be cached as NaN: every comparison against it is false, so
        // the cache would silently degrade into minting a token on every single call.
        expiresAtMs: Number.isNaN(expiresAtMs) ? Date.now() + FALLBACK_TTL_MS : expiresAtMs,
      }
      return body.token
    } catch (e) {
      // A malformed PEM, a revoked installation and a GitHub outage are the same event to a caller.
      // The detail that separates them can echo key material, so it goes no further than the log.
      logger.error('Could not mint a GitHub App installation token', e, { appId, installationId })
      throw new AppError(503, UNAVAILABLE)
    }
  }
}

/** Shared so the token cache is process-wide instead of one cache per consumer. */
export const githubAppAuth = new GitHubAppAuth()
