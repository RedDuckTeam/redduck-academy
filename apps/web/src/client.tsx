import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'
import * as Sentry from '@sentry/tanstackstart-react'

// Custom client entry (overrides @tanstack/react-start's default-entry/client.tsx).
// Identical to the framework default — StrictMode + startTransition + hydrateRoot(<StartClient />)
// — plus an `onCaughtError` hook
//
// Why: errors caught by a React error boundary (e.g. TanStack Router's error component) never
// reach `window.onerror`, so Sentry's window-based autocapture misses them. This forwards
// every boundary-caught render error to Sentry (including TanStack Router's `errorComponent`
// and our own `ErrorBoundary`), so a single hook covers all custom boundaries.
//
// We deliberately do NOT override `onUncaughtError`: React's default calls `reportError()`, which
// already surfaces uncaught errors to `window.onerror` and thus to Sentry autocapture. Overriding
// it would replace that path and risk dropping or double-counting uncaught errors
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
    {
      onCaughtError: (error, errorInfo) => {
        Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo?.componentStack } } })
        // Preserve React's default behaviour (providing onCaughtError otherwise silences it)
        console.error(error)
      },
    },
  )
})
