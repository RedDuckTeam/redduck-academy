import { build } from 'esbuild'

// Bundle the server and the migration runner into fully self-contained files.
// Everything (node_modules deps + @redduck/* workspace source) is inlined, so
// the deploy slug needs NO node_modules at runtime — `heroku-postbuild` deletes
// node_modules after this build, taking the slug from ~700MB to a few MB.
await build({
  entryPoints: ['src/index.ts', 'src/migrate.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  // Some bundled CommonJS deps call require() at the top level. createRequire
  // makes that work inside an ESM bundle. No dynamic require() of a bare module
  // is hit at runtime (verified by booting the bundle with node_modules absent),
  // so this only ever resolves against the bundle itself.
  banner: {
    js: "import { createRequire as _createRequire } from 'module'; const require = _createRequire(import.meta.url);",
  },
})
