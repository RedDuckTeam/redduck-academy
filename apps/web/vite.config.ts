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
        `
      }
    },
  }
}

const config = defineConfig({
  plugins: [
    privySsrStub(),
    nodePolyfills({ include: ['buffer'], globals: { Buffer: true } }),
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
