import type { Abi } from 'viem'
import { loadSolc } from './solc-loader'

export interface CompiledContract {
  abi: Abi
  bytecode: `0x${string}`
}

interface SolcOutput {
  errors?: Array<{ severity?: string; formattedMessage?: string; message?: string }>
  contracts?: Record<string, Record<string, { abi: Abi; evm?: { bytecode?: { object?: string } } }>>
}

const SOURCE_FILENAME = 'user.sol'

/**
 * Compiles Solidity source via solc's standard JSON interface and returns the chosen contract's
 * ABI + bytecode. Throws on compilation errors with a single concatenated message.
 */
export async function compile(source: string, preferredContract?: string): Promise<CompiledContract> {
  const Module = await loadSolc()
  const compileFn = Module.cwrap('solidity_compile', 'string', ['string', 'number']) as (
    input: string,
    callbackPtr: number,
  ) => string

  const standardInput = {
    language: 'Solidity',
    sources: { [SOURCE_FILENAME]: { content: source } },
    settings: {
      optimizer: { enabled: false },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  }

  const rawOutput = compileFn(JSON.stringify(standardInput), 0)
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
