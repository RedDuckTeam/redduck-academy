const SOLC_URL = 'https://redduck-academy-vendor.redduck.io/soljson-v0.8.24+commit.e11b9ed9.js'

// The ~7 MB soljson blob is fetched at runtime from a single self-hosted origin, so a network blip
// or CDN hiccup must not fail the compile. Bound each attempt and retry a few times with backoff.
const SOLC_FETCH_TIMEOUT_MS = 30_000
const SOLC_FETCH_ATTEMPTS = 3
const SOLC_RETRY_BASE_MS = 500

/**
 * Subset of Emscripten/solc module exports we consume. Soljson is built with the
 * defaults (`-s ALLOW_TABLE_GROWTH=1`, `-s EXPORTED_RUNTIME_METHODS=[...]`) so all
 * of these are available; missing any of them means the soljson build is unsupported.
 */
export interface SolcModule {
  cwrap: (name: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => unknown
  /** Allocates a JS function into the wasm table; returns the function pointer. */
  addFunction: (fn: (...args: number[]) => unknown, sig: string) => number
  /** Frees a slot previously taken by addFunction. */
  removeFunction?: (ptr: number) => void
  _malloc: (n: number) => number
  UTF8ToString: (ptr: number) => string
  stringToUTF8: (str: string, outPtr: number, maxBytes: number) => void
  lengthBytesUTF8: (str: string) => number
  /**
   * Writes `value` to memory at `ptr` using the given LLVM type ('i32', '*', etc).
   * Official Emscripten API; safer than HEAP32[ptr >> 2] = v across builds.
   */
  setValue: (ptr: number, value: number, type: string) => void
  HEAPU8: Uint8Array
  HEAP32: Int32Array
  calledRun?: boolean
  onRuntimeInitialized?: () => void
  /** Emscripten calls this on internal abort; if we provide it we can see the cause. */
  onAbort?: (reason: unknown) => void
  /** Emscripten stderr sink. Capturing helps diagnose abort triggers. */
  printErr?: (line: string) => void
  /** Emscripten stdout sink. */
  print?: (line: string) => void
}

let solcModulePromise: Promise<SolcModule> | null = null

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Fetches the soljson source, bounding each attempt with a timeout and retrying transient failures
 * (network error, timeout, non-2xx) with linear backoff. Throws with the last cause once attempts
 * are exhausted. No integrity check — the asset is served from our own origin.
 */
async function fetchSolcSource(): Promise<string> {
  let lastError: unknown
  for (let attempt = 1; attempt <= SOLC_FETCH_ATTEMPTS; attempt++) {
    try {
      // The signal aborts the whole request, so the timeout also covers the large body read, not
      // just the initial response headers.
      const response = await fetch(SOLC_URL, { signal: AbortSignal.timeout(SOLC_FETCH_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`solc fetch failed: ${response.status} ${response.statusText}`)
      return await response.text()
    } catch (error) {
      lastError = error
      if (attempt < SOLC_FETCH_ATTEMPTS) await delay(SOLC_RETRY_BASE_MS * attempt)
    }
  }
  throw new Error(`Failed to load solc from ${SOLC_URL} after ${SOLC_FETCH_ATTEMPTS} attempts`, { cause: lastError })
}

/**
 * Fetches and instantiates the Emscripten-compiled Solidity compiler. Result is memoized
 * for the lifetime of the worker / process. Works in browser workers and Node 20+.
 */
export function loadSolc(): Promise<SolcModule> {
  if (solcModulePromise) return solcModulePromise
  const promise = (async () => {
    const source = await fetchSolcSource()
    // soljson uses `var Module = typeof Module != "undefined" ? Module : {}` — feed it our object.
    const wrapper = new Function('Module', source + '\nreturn Module;')
    const moduleStub: Partial<SolcModule> = {}
    let onReady: () => void
    const ready = new Promise<void>((resolve) => {
      onReady = resolve
    })
    moduleStub.onRuntimeInitialized = () => onReady()
    // Capture solc's stderr lines so an abort surfaces with the real cause instead
    // of the opaque "Aborted(). Build with -sASSERTIONS for more info." message.
    const stderrLines: string[] = []
    moduleStub.printErr = (line) => {
      stderrLines.push(line)
      // Mirror to console so devtools shows the cause even before the abort fires.
      // eslint-disable-next-line no-console
      console.warn('[solc stderr]', line)
    }
    moduleStub.print = (line) => {
      // eslint-disable-next-line no-console
      console.log('[solc stdout]', line)
    }
    moduleStub.onAbort = (reason) => {
      // eslint-disable-next-line no-console
      console.error('[solc abort]', reason, 'recent stderr:', stderrLines.slice(-10))
    }
    const Module = wrapper(moduleStub) as SolcModule
    if (!Module.calledRun) await ready
    if (typeof Module.addFunction !== 'function') {
      throw new Error(
        'soljson build does not expose addFunction — cannot wire import callback. ' +
          'Confirm the soljson URL points to a build with ALLOW_TABLE_GROWTH.',
      )
    }
    return Module
  })()
  // Don't cache a rejection: if the load fails (retries exhausted, timeout, unsupported build), clear
  // the memo so the next call starts a fresh attempt instead of replaying the failure for the
  // lifetime of the worker/process.
  promise.catch(() => {
    if (solcModulePromise === promise) solcModulePromise = null
  })
  solcModulePromise = promise
  return promise
}
