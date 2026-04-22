import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { NotFoundPage } from '@/components/pages/not-found/not-found-page'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Footer from '../components/footer/Footer'
import Header from '../components/header/Header'
import { ScrollToTop } from '@/components/scroll-to-top'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { Providers } from '@/components/providers/providers'
import { Toaster } from '@/components/ui/sonner'
import { createDefaultMeta } from '@/lib/seo'
import { env } from '@/env'
import { queryKeys } from '@/lib/query-keys'
import { fetchSessionFromCookie } from '@/lib/session/get-session.server'

interface MyRouterContext {
  queryClient: QueryClient
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('redduck-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context: { queryClient } }) => {
    if (!env.VITE_PRIVY_COOKIE_AUTH) return
    await queryClient.ensureQueryData({
      queryKey: queryKeys.user.settings(),
      queryFn: () => fetchSessionFromCookie(),
      staleTime: 5 * 60 * 1000,
    })
  },
  head: () => {
    const defaultMeta = createDefaultMeta()
    return {
      meta: defaultMeta.meta,
      links: [{ rel: 'stylesheet', href: appCss }, ...(defaultMeta.links ?? [])],
    }
  },

  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>
          <ScrollToTop />
          <Header />
          {children}
          <Footer />
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
          <Toaster />

          <Scripts />
        </Providers>
      </body>
    </html>
  )
}
