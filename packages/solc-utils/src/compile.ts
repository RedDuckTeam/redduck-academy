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

/** One input file for a multi-source compile. */
export interface CompileInputFile {
  path: string
  content: string
  /** Optional contract name to select from this file. Defaults to first contract. */
  preferredContract?: string
}

/** Result of a multi-source compile — one chosen contract per input file. */
export interface CompileMultiResult {
  /** Keyed by input file path. */
  contracts: Record<string, CompiledContract>
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
  const result = await compileMulti(
    [{ path: SOURCE_FILENAME, content: source, preferredContract }],
    options,
  )
  const chosen = result.contracts[SOURCE_FILENAME]
  if (!chosen) throw new Error('No contracts found in source')
  return chosen
}

/**
 * Compiles multiple Solidity sources in one solc invocation and returns the chosen
 * contract per input file. Used by the test-case runner to compile the student's
 * source alongside lesson fixtures (peer contracts) — all share the same import
 * resolver, so any source can import OZ or the per-call overlay.
 *
 * If any source fails to compile, throws a single error containing the formatted
 * solc messages (with the failing file path inline).
 */
export async function compileMulti(
  files: CompileInputFile[],
  options: CompileOptions = {},
): Promise<CompileMultiResult> {
  if (files.length === 0) throw new Error('compileMulti: no input files')

  const Module = await loadSolc()
  const callback = loadImportCallback(Module)
  const compileFn = Module.cwrap('solidity_compile', 'string', ['string', 'number', 'number']) as (
    input: string,
    callbackPtr: number,
    contextPtr: number,
  ) => string
  const resetFn = Module.cwrap('solidity_reset', null, []) as (() => void) | undefined

  const overlay = options.imports
  const lookup: ImportLookup = overlay
    ? (path) => (path in overlay ? overlay[path] : path in STDLIB ? STDLIB[path] : null)
    : (path) => (path in STDLIB ? STDLIB[path] : null)

  const sources: Record<string, { content: string }> = {}
  for (const f of files) {
    if (sources[f.path]) {
      throw new Error(`compileMulti: duplicate source path "${f.path}"`)
    }
    sources[f.path] = { content: f.content }
  }
  const standardInput = {
    language: 'Solidity',
    sources,
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

  const contracts: Record<string, CompiledContract> = {}
  for (const f of files) {
    const fileContracts = output.contracts?.[f.path] ?? {}
    const contractNames = Object.keys(fileContracts)
    if (contractNames.length === 0) {
      throw new Error(`No contracts found in source "${f.path}"`)
    }
    const chosenName =
      f.preferredContract && fileContracts[f.preferredContract] ? f.preferredContract : contractNames[0]
    const chosen = fileContracts[chosenName]
    const bytecodeHex = chosen?.evm?.bytecode?.object
    if (!bytecodeHex) {
      throw new Error(`Contract "${chosenName}" in "${f.path}" has no bytecode`)
    }
    contracts[f.path] = {
      abi: chosen.abi,
      bytecode: (bytecodeHex.startsWith('0x') ? bytecodeHex : `0x${bytecodeHex}`) as `0x${string}`,
    }
  }

  return { contracts }
}
