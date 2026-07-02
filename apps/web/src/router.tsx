import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as Sentry from '@sentry/tanstackstart-react'
import * as Providers from './integrations/tanstack-query/root-provider'
import { env } from './env'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instan
export const getRouter = () => {
  const providersContext = Providers.getContext()

  const router = createRouter({
    routeTree,
    context: {
      ...providersContext,
    },

    defaultPreload: 'intent',
    // Without this, hover-preloads re-run loaders/beforeLoad every 30s — every link hover on a
    // stale route refires the request. We let TanStack Query own caching; preload runs once.
    defaultPreloadStaleTime: Number.POSITIVE_INFINITY,
  })

  // Client-only init. Skip when DSN is empty (local dev without a Sentry project) so
  // we don't spam console warnings. Replay records nothing in normal sessions and 100%
  // of sessions where an error fires — the cheap setup that actually helps debug crashes.
  if (!router.isServer && env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: env.VITE_SENTRY_DSN,
      sendDefaultPii: true,
      integrations: [Sentry.replayIntegration()],
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      tracesSampleRate: 0.1,
    })
  }

  setupRouterSsrQueryIntegration({
    router,
    queryClient: providersContext.queryClient,
  })

  return router
}
