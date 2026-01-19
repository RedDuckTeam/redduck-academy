import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as Providers from './integrations/tanstack-query/root-provider'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const providersContext = Providers.getContext()

  const router = createRouter({
    routeTree,
    context: {
      ...providersContext,
    },

    defaultPreload: 'intent',
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient: providersContext.queryClient,
  })

  return router
}
