import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

function getCoursePrerenderPaths(): Array<{ path: string }> {
  return []
}

const config = defineConfig({
  plugins: [
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
