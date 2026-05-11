const SOLC_URL = 'https://binaries.soliditylang.org/bin/soljson-v0.8.24+commit.e11b9ed9.js'

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

/**
 * Fetches and instantiates the Emscripten-compiled Solidity compiler. Result is memoized
 * for the lifetime of the worker / process. Works in browser workers and Node 20+.
 */
export function loadSolc(): Promise<SolcModule> {
  if (solcModulePromise) return solcModulePromise
  solcModulePromise = (async () => {
    const response = await fetch(SOLC_URL)
    if (!response.ok) throw new Error(`Failed to fetch solc: ${response.status}`)
    const source = await response.text()
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
  return solcModulePromise
}
