import { defineConfig, loadEnv, type Plugin } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { requiredClientEnv } from './src/env-schema'

// Required client env vars come straight from the env schema (src/env-schema.ts):
// `requiredClientEnv` is every var with no default. If any is empty the `createEnv`
// validation throws at runtime — bundled into both the client and SSR output, so every
// request 500s and the client white-screens. CI sources these from GitHub repo Variables
// (`${{ vars.* }}`), which resolve to empty strings when unset, so a missing var ships
// silently. Assert them at build time to fail CI fast with a clear message.
function assertRequiredEnv(): Plugin {
  return {
    name: 'assert-required-env',
    enforce: 'pre',
    config(_, { command, mode }) {
      if (command !== 'build') return
      const env = loadEnv(mode, process.cwd(), 'VITE_')
      const missing = requiredClientEnv.filter((key) => !env[key] && !process.env[key])
      if (missing.length > 0) {
        throw new Error(
          `[build] Missing required env var(s): ${missing.join(', ')}. ` +
            `Set them before building (CI: GitHub repo Variables → Settings → Secrets and variables → Actions → Variables).`,
        )
      }
    },
  }
}

// @privy-io/react-auth uses browser-only APIs (localStorage, window, etc.) that
// crash in the Cloudflare Workers SSR environment. Replace it with no-ops on the
// server (see privySsrStub below); the real SDK only loads in the client bundle.
function privySsrStub(): Plugin {
  const VIRTUAL = '\0privy-ssr-stub'
  return {
    name: 'privy-ssr-stub',
    enforce: 'pre',
    resolveId(id, _, opts) {
      if (opts?.ssr && id === '@privy-io/react-auth') return VIRTUAL
    },
    load(id) {
      if (id === VIRTUAL) {
        return `
          export const PrivyProvider = ({ children }) => children;
          export const usePrivy = () => ({ ready: false, authenticated: false, logout: async () => {} });
          export const useLogin = () => ({ login: () => {} });
          export const useLogout = () => ({ logout: async () => {} });
          export const useLoginWithOAuth = () => ({ initOAuth: async () => {}, loading: false, state: {} });
          export const useWallets = () => ({ wallets: [] });
          export const useCreateWallet = () => ({ createWallet: async () => ({}) });
          export const useLinkAccount = () => ({ linkGoogle: () => {}, linkWallet: () => {} });
          export const useExportWallet = () => ({ exportWallet: async () => {} });
        `
      }
    },
  }
}

// posthog-js is a browser SDK that bloats the Worker bundle past the size limit.
// Stub @posthog/react on SSR — analytics only run client-side anyway.
function posthogSsrStub(): Plugin {
  const VIRTUAL = '\0posthog-ssr-stub'
  return {
    name: 'posthog-ssr-stub',
    enforce: 'pre',
    resolveId(id, _, opts) {
      if (opts?.ssr && id === '@posthog/react') return VIRTUAL
    },
    load(id) {
      if (id === VIRTUAL) {
        return `
          export const PostHogProvider = ({ children }) => children;
          export const usePostHog = () => ({
            capture: () => {},
            captureException: () => {},
            opt_in_capturing: () => {},
            opt_out_capturing: () => {},
          });
        `
      }
    },
  }
}

// Sentry's server build still adds a couple hundred KB to the Worker bundle even
// though we only ever call init/captureException on the client (router.tsx gates
// with `!router.isServer`, client.tsx is browser-only). Stub it on SSR — no calls
// fire there, so no behaviour changes.
function sentrySsrStub(): Plugin {
  const VIRTUAL = '\0sentry-ssr-stub'
  return {
    name: 'sentry-ssr-stub',
    enforce: 'pre',
    resolveId(id, _, opts) {
      if (opts?.ssr && id === '@sentry/tanstackstart-react') return VIRTUAL
    },
    load(id) {
      if (id === VIRTUAL) {
        return `
          export const init = () => {};
          export const captureException = () => {};
          export const captureMessage = () => {};
          export const replayIntegration = () => ({});
          export const withErrorBoundary = (c) => c;
          export const wrapFetchWithSentry = (h) => h;
          export const sentryGlobalRequestMiddleware = (_, next) => next();
          export const sentryGlobalFunctionMiddleware = (_, next) => next();
        `
      }
    },
  }
}

const config = defineConfig({
  optimizeDeps: {
    // Pre-bundle browser-only PDF/image libs so dev-server dynamic imports resolve cleanly.
    include: ['jspdf', 'html-to-image'],
  },
  resolve: {
    alias: [
      // `use-sidecar` (transitive via Radix) uses `detect-node-es` whose conditional
      // resolution lands on the `node` variant in the Cloudflare SSR env, which
      // references bare `process` and breaks the polyfill rewrite. Force the browser
      // variant — both just return `isNode = false` in non-Node environments.
      { find: /^detect-node-es$/, replacement: 'detect-node-es/esm/browser.js' },
    ],
  },
  plugins: [
    assertRequiredEnv(),
    privySsrStub(),
    posthogSsrStub(),
    sentrySsrStub(),
    nodePolyfills({ include: ['buffer', 'process'], globals: { Buffer: true, process: true } }),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: false,
      },
    }),
    viteReact(),
    // Source map upload to Sentry — only active when SENTRY_AUTH_TOKEN is present
    // (CI prod build). Without the token the plugin no-ops, so local dev is unaffected.
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryTanstackStart({
            org: 'jeleika',
            project: 'javascript-tanstackstart-react',
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }),
        ]
      : []),
  ],
})

export default config
