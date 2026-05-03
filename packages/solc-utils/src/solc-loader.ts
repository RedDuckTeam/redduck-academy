const SOLC_URL = 'https://binaries.soliditylang.org/bin/soljson-v0.8.24+commit.e11b9ed9.js'

export interface SolcModule {
  cwrap: (name: string, returnType: string, argTypes: string[]) => (...args: unknown[]) => unknown
  calledRun?: boolean
  onRuntimeInitialized?: () => void
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
    const Module = wrapper(moduleStub) as SolcModule
    if (!Module.calledRun) await ready
    return Module
  })()
  return solcModulePromise
}
