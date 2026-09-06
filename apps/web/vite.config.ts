import fs from 'node:fs/promises'
import path from 'node:path'
// Relative imports carry their `.ts` extension so Vite can load this config with the
// native (Node) loader, which it plans to make the default in a future major.
import { CONTENT_ASSET_PREFIX } from './src/lib/content/paths.ts'
import { buildContentTree, coursesIndexJson, courseManifestJson } from './src/lib/content/build-manifest.ts'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { requiredClientEnv } from './src/env-schema.ts'

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

// Serves the open-source `content/` Markdown tree (repo root) as static assets at
// `/_content/<course>/<module>/<lesson>.md` — in dev straight from disk, and in the
// prod build emitted into the client output so Cloudflare serves them from its CDN
// (NOT bundled into the Worker or the client JS). The SSR loader fetches the current
// lesson's file at request time; see lib/content/lesson-body.
//
// Alongside the prose it emits two structure manifests built from the files' frontmatter,
// so the whole program and any lecture render with no backend (see lib/content/manifest):
//   • `/_content/_courses.json`           — every course, structure only (program pages).
//   • `/_content/<course>/_manifest.json` — one course's structure + per-lesson faq
//                                            (loaded on a lesson page, that course only).
function contentAssets(): Plugin {
  const CONTENT_DIR = path.resolve(import.meta.dirname, '../../content')
  const PREFIX = CONTENT_ASSET_PREFIX
  const EMIT_DIR = CONTENT_ASSET_PREFIX.replace(/^\//, '') // "_content/" without the leading slash

  async function mdFiles(dir: string): Promise<string[]> {
    const out: string[] = []
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) out.push(...(await mdFiles(p)))
      else if (e.name.endsWith('.md')) out.push(p)
    }
    return out
  }

  return {
    name: 'content-assets',
    configureServer(server) {
      // Rebuild the tree lazily and cache it; invalidate whenever a content file changes so
      // a new/edited lesson shows up on the next request without restarting the dev server.
      let treeCache: ReturnType<typeof buildContentTree> | null = null
      const getTree = () => (treeCache ??= buildContentTree(CONTENT_DIR))
      server.watcher.add(CONTENT_DIR)
      server.watcher.on('all', (_event, file) => {
        if (file.startsWith(CONTENT_DIR + path.sep)) treeCache = null
      })

      const sendJson = (res: import('node:http').ServerResponse, body: string) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(body)
      }

      server.middlewares.use((req, res, next) => {
        const url = req.url
        if (!url || !url.startsWith(PREFIX)) return next()
        const rel = decodeURIComponent(url.slice(PREFIX.length).split('?')[0])

        if (rel === '_courses.json') {
          getTree().then((tree) => sendJson(res, coursesIndexJson(tree)), () => next())
          return
        }
        const courseManifest = rel.match(/^([^/]+)\/_manifest\.json$/)
        if (courseManifest) {
          getTree().then((tree) => {
            const course = tree.find((c) => c.slug === courseManifest[1])
            if (!course) return next()
            sendJson(res, courseManifestJson(course))
          }, () => next())
          return
        }

        const filePath = path.join(CONTENT_DIR, rel)
        // Guard against path traversal; only serve Markdown.
        if (!filePath.startsWith(CONTENT_DIR + path.sep) || !filePath.endsWith('.md')) return next()
        fs.readFile(filePath).then(
          (data) => {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.end(data)
          },
          () => next(),
        )
      })
    },
    async generateBundle() {
      // Emit only into the client build (the source of Cloudflare static assets).
      if (this.environment && this.environment.name !== 'client') return
      for (const abs of await mdFiles(CONTENT_DIR)) {
        const rel = path.relative(CONTENT_DIR, abs).split(path.sep).join('/')
        this.emitFile({ type: 'asset', fileName: `${EMIT_DIR}${rel}`, source: await fs.readFile(abs) })
      }
      // Structure manifests derived from the same files' frontmatter.
      const tree = await buildContentTree(CONTENT_DIR)
      this.emitFile({ type: 'asset', fileName: `${EMIT_DIR}_courses.json`, source: coursesIndexJson(tree) })
      for (const course of tree) {
        this.emitFile({
          type: 'asset',
          fileName: `${EMIT_DIR}${course.slug}/_manifest.json`,
          source: courseManifestJson(course),
        })
      }
    },
  }
}

const config = defineConfig({
  optimizeDeps: {
    // Pre-bundle browser-only PDF/image libs so dev-server dynamic imports resolve cleanly.
    // The markdown stack (used by MarkdownContent) is pre-bundled too, otherwise the dev
    // server re-optimizes mid-request the first time a lesson renders and briefly loads a
    // second React copy (Invalid hook call in SSR).
    include: [
      'jspdf',
      'html-to-image',
      'react-markdown',
      'remark-gfm',
      'rehype-raw',
      'rehype-sanitize',
      'hast-util-to-html',
      'mdast-util-from-markdown',
      'mdast-util-to-string',
    ],
  },
  resolve: {
    // `@/*` → `src/*`, read from tsconfig.json (replaces vite-tsconfig-paths, native since Vite 8).
    tsconfigPaths: true,
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
    contentAssets(),
    privySsrStub(),
    posthogSsrStub(),
    sentrySsrStub(),
    nodePolyfills({ include: ['buffer', 'process'], globals: { Buffer: true, process: true } }),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
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
            org: 'mrjeleikaorg',
            project: 'redduck-academy',
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }),
        ]
      : []),
  ],
})

export default config
