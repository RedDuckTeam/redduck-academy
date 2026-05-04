import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as Providers from './integrations/tanstack-query/root-provider'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instanc
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

  setupRouterSsrQueryIntegration({
    router,
    queryClient: providersContext.queryClient,
  })

  return router
}
