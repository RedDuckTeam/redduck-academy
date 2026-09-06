import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

// Isolated config for unit tests: just the React plugin and a jsdom environment.
// Deliberately avoids the app's Cloudflare/TanStack-Start plugins so component
// tests don't boot the SSR/worker stack.
export default defineConfig({
  // `@/*` → `src/*`, read from tsconfig.json (replaces vite-tsconfig-paths, native since Vite 8).
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
