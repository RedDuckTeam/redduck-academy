import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/header/Header'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { Providers } from '@/components/providers/providers'
import { Toaster } from '@/components/ui/sonner'
import { createDefaultMeta } from '@/lib/seo'

interface MyRouterContext {
  queryClient: QueryClient
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('redduck-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => {
    const defaultMeta = createDefaultMeta()
    return {
      meta: defaultMeta.meta,
      links: [{ rel: 'stylesheet', href: appCss }, ...(defaultMeta.links ?? [])],
    }
  },

  shellComponent: RootDocument,
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
          <Header />
          {children}
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
