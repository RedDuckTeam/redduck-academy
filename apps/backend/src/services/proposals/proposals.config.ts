import { env } from '../../env'
import { AppError } from '../../lib/errors'

/** Every proposal branch and pull request targets this branch. */
export const BASE_BRANCH = 'main'

/** Label that marks a pull request as contributor-authored and unreviewed. */
export const PROPOSAL_LABEL = 'community-proposal'

/** Added on the anonymous door, so a saved search can separate the two without using draft state. */
export const UNVERIFIED_AUTHOR_LABEL = 'unverified-author'

/** Prefix every proposal ref must carry. Asserted again immediately before each git ref write. */
export const PROPOSAL_BRANCH_PREFIX = 'proposal/'

/**
 * Configuration is read through these accessors rather than off `env` directly so a missing value
 * is a 503 at the call site instead of a silent skip.
 *
 * `env.ts` parses `process.env` eagerly at import, so making these required would crash-loop every
 * dyno the moment the code deploys ahead of the config vars. Optional-plus-fail-closed keeps the
 * rest of the API up while refusing to run this feature half-configured — which for
 * `TURNSTILE_SECRET_KEY` in particular is the difference between "captcha off" and "unauthenticated
 * write access to the repository".
 */
const UNAVAILABLE = 'Lesson proposals are temporarily unavailable'

function required(value: string | undefined, name: string): string {
  if (!value) throw new AppError(503, UNAVAILABLE, { missing: name })
  return value
}

export function assertProposalsEnabled(): void {
  if (!env.PROPOSALS_ENABLED) throw new AppError(503, UNAVAILABLE, { missing: 'PROPOSALS_ENABLED' })
}

export interface ProposalsRepoConfig {
  owner: string
  repo: string
  appId: string
  installationId: string
  /** PKCS#1 PEM. Heroku config vars flatten real newlines, so escaped ones are restored. */
  privateKey: string
}

export function proposalsRepoConfig(): ProposalsRepoConfig {
  const slug = required(env.PROPOSALS_REPO, 'PROPOSALS_REPO')
  const [owner, repo] = slug.split('/')
  if (!owner || !repo) throw new AppError(503, UNAVAILABLE, { missing: 'PROPOSALS_REPO must be "owner/repo"' })

  return {
    owner,
    repo,
    appId: required(env.GITHUB_APP_ID, 'GITHUB_APP_ID'),
    installationId: required(env.GITHUB_APP_INSTALLATION_ID, 'GITHUB_APP_INSTALLATION_ID'),
    privateKey: required(env.GITHUB_APP_PRIVATE_KEY, 'GITHUB_APP_PRIVATE_KEY').replace(/\\n/g, '\n'),
  }
}

export function turnstileSecret(): string {
  return required(env.TURNSTILE_SECRET_KEY, 'TURNSTILE_SECRET_KEY')
}

export function ipPepper(): string {
  return required(env.PROPOSALS_IP_PEPPER, 'PROPOSALS_IP_PEPPER')
}

/** Public site origin, used to build the editor link a maintainer can send a contributor back to. */
export function siteOrigin(): string {
  const [first] = env.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  return required(first, 'ALLOWED_ORIGINS').replace(/\/$/, '')
}

/** Hostnames a Turnstile token may legitimately have been solved on. */
export function allowedTurnstileHostnames(): string[] {
  return env.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).hostname
      } catch {
        return origin
      }
    })
}
