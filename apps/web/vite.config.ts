import { defineConfig, type Plugin } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// @privy-io/react-auth uses browser-only APIs (localStorage, window, etc.) that
// crash in the Cloudflare Workers SSR environment. Replace it with no-ops on the
// server; the real SDK loads client-side via React.lazy in privy-provider.tsx.
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
    privySsrStub(),
    posthogSsrStub(),
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
  ],
})

export default config
