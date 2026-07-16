import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

// Isolated config for unit tests: just the React + path-alias plugins and a jsdom
// environment. Deliberately avoids the app's Cloudflare/TanStack-Start plugins so
// component tests don't boot the SSR/worker stack.
export default defineConfig({
  plugins: [viteTsConfigPaths({ projects: ['./tsconfig.json'] }), viteReact()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
