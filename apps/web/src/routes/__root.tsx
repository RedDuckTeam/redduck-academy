import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { PostHogProvider } from '@posthog/react'
import { NotFoundPage } from '@/components/pages/not-found/not-found-page'
import { ErrorPage } from '@/components/pages/error/error-page'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Footer from '../components/footer/Footer'
import Header from '../components/header/Header'
import { ScrollToTop } from '@/components/scroll-to-top'
import { CookieBanner } from '@/components/cookie-banner/cookie-banner'
import { CookieConsentProvider } from '@/lib/cookie-consent'
import { PostHogConsentBridge } from '@/components/posthog-consent-bridge'
import { env } from '@/env'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import ibmPlex400 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url'
import ibmPlex500 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2?url'
import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff2?url'
import inter500 from '@fontsource/inter/files/inter-latin-500-normal.woff2?url'

import type { QueryClient } from '@tanstack/react-query'
import { Providers } from '@/components/providers/providers'
import { Toaster } from '@/components/ui/sonner'
import { createDefaultMeta } from '@/lib/seo'

interface MyRouterContext {
  queryClient: QueryClient
}

// Tests for private class methods (Safari 15.4+, the floor of our bundle).
// If the parser can't handle it, replace the document with a plain upgrade
// prompt. The script itself uses only ES5, so it parses on every browser.
const browserGateScript = `(function(){try{Function('"use strict";class _C{#m(){return 1}}');}catch(e){document.documentElement.innerHTML='<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Browser update required</title></head><body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#000;color:#e0deda;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center"><h1 style="font-size:28px;margin:0 0 16px;font-weight:600">Your browser is out of date</h1><p style="font-size:16px;line-height:1.5;max-width:480px;margin:0">Redduck Academy needs a modern browser to run. On iPhone or iPad, update through Settings &rarr; General &rarr; Software Update. On desktop, please upgrade to the latest Chrome, Safari, Firefox, or Edge.</p></body>';throw e;}})();`

const themeInitScript = `(function(){try{var t=localStorage.getItem('redduck-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => {
    const defaultMeta = createDefaultMeta()
    const preloadFont = (href: string) => ({
      rel: 'preload',
      as: 'font',
      type: 'font/woff2',
      href,
      crossOrigin: 'anonymous' as const,
    })
    return {
      meta: defaultMeta.meta,
      links: [
        { rel: 'stylesheet', href: appCss },
        preloadFont(ibmPlex400),
        preloadFont(ibmPlex500),
        preloadFont(inter400),
        preloadFont(inter500),
        ...(defaultMeta.links ?? []),
      ],
    }
  },

  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext()
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: browserGateScript }} />
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <CookieConsentProvider>
          <PostHogProvider
            apiKey={env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN}
            options={{
              api_host: 'https://eu.i.posthog.com',
              capture_pageleave: false,
              ui_host: env.VITE_PUBLIC_POSTHOG_HOST,
              defaults: '2025-05-24',
              capture_exceptions: true,
              debug: import.meta.env.DEV,
              opt_out_capturing_by_default: true,
              opt_out_persistence_by_default: true,
              autocapture: false,
              disable_session_recording: false,
              session_recording: {
                maskAllInputs: true,
              },
            }}
          >
            <PostHogConsentBridge />
            <Providers queryClient={queryClient}>
              <ScrollToTop />
              <Header />
              {children}
              <Footer />
              {import.meta.env.DEV && (
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
              )}
              <Toaster />
              <CookieBanner />

              <Scripts />
            </Providers>
          </PostHogProvider>
        </CookieConsentProvider>
      </body>
    </html>
  )
}
