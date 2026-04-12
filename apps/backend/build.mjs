import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/index.js',
  plugins: [
    {
      name: 'bundle-workspace-packages',
      setup(build) {
        // Externalize all node_modules packages except @redduck/* workspace packages,
        // which are TypeScript source and must be bundled directly.
        build.onResolve({ filter: /^[^./]/ }, (args) => {
          if (args.path.startsWith('@redduck/')) return
          return { external: true }
        })
      },
    },
  ],
})
