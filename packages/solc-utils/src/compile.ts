import type { Abi } from 'viem'
import { loadSolc } from './solc-loader'
import { loadImportCallback, type ImportLookup } from './import-callback'
import { STDLIB } from './stdlib.generated'

export interface CompiledContract {
  abi: Abi
  bytecode: `0x${string}`
}

export interface CompileOptions {
  /**
   * Per-call source overlay keyed by canonical import path. Wins over the bundled
   * stdlib on collision — used by future fixture support to inject mocks per lesson.
   * Leave empty for plain student-only compiles.
   */
  imports?: Record<string, string>
}

interface SolcOutput {
  errors?: Array<{ severity?: string; formattedMessage?: string; message?: string }>
  contracts?: Record<string, Record<string, { abi: Abi; evm?: { bytecode?: { object?: string } } }>>
}

const SOURCE_FILENAME = 'user.sol'

/**
 * Compiles Solidity source via solc's standard JSON interface and returns the chosen contract's
 * ABI + bytecode. Throws on compilation errors with a single concatenated message.
 *
 * Imports are resolved via solc's read callback against (optionally) per-call overrides
 * and the bundled `STDLIB` (OpenZeppelin + any vendored Redduck helpers). Students can
 * `import "@openzeppelin/contracts/..."` without any extra setup.
 */
export async function compile(
  source: string,
  preferredContract?: string,
  options: CompileOptions = {},
): Promise<CompiledContract> {
  const Module = await loadSolc()
  const callback = loadImportCallback(Module)
  // `solidity_compile` is a 3-arg C function: (input, readCallback, readCallbackContext).
  // Declaring fewer args makes wasm read garbage for the missing context, which can
  // trigger `Aborted()` once the callback is actually used. Pass 0 for the context.
  const compileFn = Module.cwrap('solidity_compile', 'string', ['string', 'number', 'number']) as (
    input: string,
    callbackPtr: number,
    contextPtr: number,
  ) => string
  // `solidity_reset` releases everything allocated via `solidity_alloc` during the
  // compile (including memory we handed back via the import callback). Without this,
  // solc never frees those buffers and we leak per-compile.
  const resetFn = Module.cwrap('solidity_reset', null, []) as (() => void) | undefined

  const overlay = options.imports
  const lookup: ImportLookup = overlay
    ? (path) => (path in overlay ? overlay[path] : path in STDLIB ? STDLIB[path] : null)
    : (path) => (path in STDLIB ? STDLIB[path] : null)

  const standardInput = {
    language: 'Solidity',
    sources: { [SOURCE_FILENAME]: { content: source } },
    settings: {
      optimizer: { enabled: false },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  }

  callback.setLookup(lookup)
  let rawOutput: string
  try {
    rawOutput = compileFn(JSON.stringify(standardInput), callback.pointer, 0)
  } finally {
    callback.setLookup(null)
    // Free everything solc + the import callback allocated this compile. Matches
    // solc-js's post-compile cleanup.
    resetFn?.()
  }

  let output: SolcOutput
  try {
    output = JSON.parse(rawOutput) as SolcOutput
  } catch {
    throw new Error('solc returned non-JSON output')
  }

  const errors = (output.errors ?? []).filter((e) => e.severity === 'error')
  if (errors.length > 0) {
    const msg = errors.map((e) => e.formattedMessage || e.message || 'unknown').join('\n')
    throw new Error(msg.trim() || 'Compilation failed')
  }

  const fileContracts = output.contracts?.[SOURCE_FILENAME] ?? {}
  const contractNames = Object.keys(fileContracts)
  if (contractNames.length === 0) throw new Error('No contracts found in source')

  const chosenName = preferredContract && fileContracts[preferredContract] ? preferredContract : contractNames[0]
  const chosen = fileContracts[chosenName]
  const bytecodeHex = chosen?.evm?.bytecode?.object
  if (!bytecodeHex) throw new Error(`Contract "${chosenName}" has no bytecode`)

  return {
    abi: chosen.abi,
    bytecode: (bytecodeHex.startsWith('0x') ? bytecodeHex : `0x${bytecodeHex}`) as `0x${string}`,
  }
}
