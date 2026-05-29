import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'
import posthog from 'posthog-js'

// Custom client entry (overrides @tanstack/react-start's default-entry/client.tsx).
// Identical to the framework default — StrictMode + startTransition + hydrateRoot(<StartClient />)
// — plus an `onCaughtError` hook.
//
// Why: errors caught by a React error boundary (e.g. TanStack Router's error component) never
// reach `window.onerror`, so PostHog's window-based exception autocapture (`capture_exceptions`)
// misses them — that's why the Privy "Embedded wallet is only available over HTTPS" crash showed
// the fallback UI but produced no event. This forwards boundary-caught render errors to PostHog.
//
// We deliberately do NOT override `onUncaughtError`: React's default calls `reportError()`, which
// already surfaces uncaught errors to `window.onerror` and thus to PostHog autocapture. Overriding
// it would replace that path and risk dropping or double-counting uncaught errors.
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
    {
      onCaughtError: (error, errorInfo) => {
        posthog.captureException(error, { componentStack: errorInfo?.componentStack })
        // Preserve React's default behaviour (providing onCaughtError otherwise silences it).
        console.error(error)
      },
    },
  )
})
