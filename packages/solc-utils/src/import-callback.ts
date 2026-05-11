import type { SolcModule } from './solc-loader'

/**
 * Allocates `n` bytes using solc's allocator. Falls back to `_malloc` if the
 * build doesn't expose `solidity_alloc` (pre-0.6.0 — we don't currently support
 * that range, but the fallback keeps the code resilient).
 *
 * NOTE: this is THE critical bit that makes import callbacks not corrupt solc's
 * heap. Plain `_malloc` allocates from a region solc cannot track or free, so
 * memory passed back via callback gets clobbered. solc-js uses `solidity_alloc`
 * + `solidity_reset` (after compile) for exactly this reason.
 */
function makeAllocator(mod: SolcModule): (n: number) => number {
  const fn = mod.cwrap('solidity_alloc', 'number', ['number']) as (n: number) => number
  if (typeof fn === 'function') return fn
  return mod._malloc.bind(mod)
}

/**
 * Returns the source for a requested import path, or `null` if the path is unknown.
 * Must be synchronous: solc's import callback is a sync C function called from wasm.
 */
export type ImportLookup = (path: string) => string | null

export interface ImportCallback {
  pointer: number
  setLookup(lookup: ImportLookup | null): void
  destroy(): void
}

const callbackByModule = new WeakMap<SolcModule, ImportCallback>()

/**
 * Register (once per solc module) a JS function that solc invokes during compile
 * whenever it encounters an `import "..."` statement. The function looks up the
 * requested path in whichever lookup is currently active.
 *
 * Important invariants enforced here, learned the hard way:
 *
 *  1. The callback MUST be wrapped in try/catch. Any exception bubbling back into
 *     wasm triggers `Aborted()` with no recoverable error message.
 *  2. The callback MUST write something to either `o_contents` or `o_error`
 *     before returning, including on non-`source` kinds. Returning with both
 *     pointers untouched is treated by solc as a broken callback.
 *  3. We allocate one wasm table slot for the module's lifetime; each compile
 *     swaps the active lookup via `setLookup` rather than re-registering, so we
 *     don't leak slots across compiles.
 *  4. `HEAP32` / `HEAPU8` views can be invalidated when memory grows during a
 *     `_malloc`. Access them only via `mod.HEAP32` so JS picks up the current
 *     ArrayBuffer view each time.
 */
export function loadImportCallback(mod: SolcModule): ImportCallback {
  const cached = callbackByModule.get(mod)
  if (cached) return cached

  let current: ImportLookup | null = null
  const allocate = makeAllocator(mod)

  const writeCString = (str: string): number => {
    const len = mod.lengthBytesUTF8(str)
    const ptr = allocate(len + 1)
    if (ptr === 0) throw new Error('solc heap allocator returned NULL')
    mod.stringToUTF8(str, ptr, len + 1)
    return ptr
  }

  const writeError = (outPtr: number, message: string): void => {
    try {
      const ptr = writeCString(message)
      mod.setValue(outPtr, ptr, '*')
    } catch {
      // If we can't even allocate the error string, leave the output untouched —
      // solc will fail to compile but at least we won't re-throw into wasm.
    }
  }

  // Signature 'viiiii' = void return, 5 i32 args.
  // solc passes: (context, kind, data, *o_contents, *o_error).
  const cb = (
    _ctxPtr: number,
    kindPtr: number,
    dataPtr: number,
    contentsOutPtr: number,
    errorOutPtr: number,
  ): void => {
    let requestedForLog = '<not-yet-read>'
    try {
      const kind = mod.UTF8ToString(kindPtr)
      if (kind !== 'source') {
        // eslint-disable-next-line no-console
        console.warn('[solc import callback] unsupported kind', kind)
        writeError(errorOutPtr, `Unsupported import kind: ${kind}`)
        return
      }
      const requested = mod.UTF8ToString(dataPtr)
      requestedForLog = requested
      const lookup = current
      if (!lookup) {
        // eslint-disable-next-line no-console
        console.warn('[solc import callback] no lookup registered for', requested)
        writeError(errorOutPtr, `No import resolver registered: ${requested}`)
        return
      }
      const content = lookup(requested)
      if (content === null || content === undefined) {
        // eslint-disable-next-line no-console
        console.warn('[solc import callback] miss', requested)
        writeError(errorOutPtr, `File not found: ${requested}`)
        return
      }
      const ptr = writeCString(content)
      mod.setValue(contentsOutPtr, ptr, '*')
      // eslint-disable-next-line no-console
      console.debug('[solc import callback] hit', requested, 'bytes=', content.length, 'ptr=', ptr)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[solc import callback] threw for', requestedForLog, err)
      writeError(errorOutPtr, `import callback error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const pointer = mod.addFunction(cb, 'viiiii')

  const callback: ImportCallback = {
    pointer,
    setLookup(lookup) {
      current = lookup
    },
    destroy() {
      current = null
      mod.removeFunction?.(pointer)
      callbackByModule.delete(mod)
    },
  }
  callbackByModule.set(mod, callback)
  return callback
}
