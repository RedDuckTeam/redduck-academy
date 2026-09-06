import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  GITHUB_TOKEN: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().min(1),
  /** Comma-separated allowed origins for CORS and Better-Auth trusted origins */
  ALLOWED_ORIGINS: z.string().min(1),
  /** Domain used in SIWE messages — MUST match the frontend host users sign on. */
  SIWE_DOMAIN: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  PRIVY_APP_ID: z.string().min(1),
  PRIVY_APP_SECRET: z.string().min(1),
  PRIVY_VERIFICATION_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  /**
   * PgBouncer (transaction-mode) pooled connection string. Set by Heroku's
   * `pg:connection-pooling:attach`. When present it's used for runtime queries
   * so many client connections multiplex onto a few server connections;
   * migrations still run against the direct DATABASE_URL.
   */
  DATABASE_CONNECTION_POOL_URL: z.string().optional(),
  PAYLOAD_SECRET: z.string().min(1),
  /** Which AI vendor backs the review subsystem. OpenAI by default; set to `anthropic` for Claude. */
  AI_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  OPENAI_API_KEY: z.string().min(1),
  /** Required only when AI_PROVIDER=anthropic; validated at provider construction, not here. */
  ANTHROPIC_API_KEY: z.string().optional(),
  /**
   * Lesson-edit proposals (the in-browser editor's write path). All optional so a dyno without
   * them still boots — `env.ts` parses eagerly at import, so a newly-required var that is not yet
   * set on Heroku crash-loops every dyno. Each is validated where it is used; see
   * services/proposals/proposals.config.ts, which fails closed rather than degrading.
   */
  // Preprocessed rather than a bare `stringbool`, which rejects '' — and an empty config var (or a
  // bare `PROPOSALS_ENABLED=` line that dotenv reads as '') would then crash-loop every dyno at
  // import, taking the whole API down over a flag that is meant to be optional.
  PROPOSALS_ENABLED: z.preprocess((v) => (v === '' ? undefined : v), z.stringbool().default(false)),
  /** Target of the proposal branch and pull request, as `owner/repo`. */
  PROPOSALS_REPO: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_INSTALLATION_ID: z.string().optional(),
  /** PKCS#1 PEM from GitHub. Heroku config vars flatten newlines; escaped \n is accepted. */
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  /** HMAC pepper for contributor IP prefixes. A bare hash of an IPv4 address is reversible. */
  PROPOSALS_IP_PEPPER: z.string().optional(),
  R2_BUCKET: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_ENDPOINT: z.string().min(1),
  R2_PUBLIC_URL: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
