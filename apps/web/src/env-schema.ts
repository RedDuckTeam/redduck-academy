import { z } from 'zod'

// Client env schema, kept separate from env.ts so it can be imported anywhere —
// including vite.config.ts (build-time env assertion). env.ts wraps this with
// `createEnv` + `import.meta.env`, which only exists in the app bundle, so the
// config can't import env.ts directly.
export const clientPrefix = 'VITE_'

export const clientEnvSchema = {
  VITE_API_URL: z.string().min(1),
  VITE_APP_URL: z.string().min(1),
  VITE_CHAIN_ENV: z.enum(['development', 'production']).default('development'),
  VITE_PRIVY_APP_ID: z.string().min(1),
  VITE_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().min(1),
  VITE_PUBLIC_POSTHOG_HOST: z.string().url().default('https://eu.posthog.com'),
  // Optional — when empty, Sentry init is skipped (e.g. local dev without a project).
  VITE_SENTRY_DSN: z.string().default(''),
  // Turnstile sitekey for the lesson-proposal captcha. Defaulted so an environment without the
  // feature configured still builds; the submit dialog says so rather than rendering a dead widget.
  VITE_TURNSTILE_SITE_KEY: z.string().default(''),
}

// Keys that must be provided (no default / not optional) — derived from the schema
// itself: a var is required iff validating `undefined` fails. Single source of truth,
// so adding a required var to the schema automatically extends the build-time check.
export const requiredClientEnv = Object.entries(clientEnvSchema)
  .filter(([, schema]) => !schema.safeParse(undefined).success)
  .map(([key]) => key)
