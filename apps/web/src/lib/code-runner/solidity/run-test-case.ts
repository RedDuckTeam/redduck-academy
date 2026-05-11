import { createEVM } from '@ethereumjs/evm'
import { type Address, hexToBytes, bytesToHex, createAddressFromString } from '@ethereumjs/util'
import {
  encodeFunctionData,
  decodeFunctionResult,
  encodeDeployData,
  type Abi,
  type AbiFunction,
} from 'viem'
import { coerceArgs, normalizeReturnValue } from './abi-coerce'

/**
 * Named caller addresses for test cases. Each alias maps to a fixed 20-byte
 * address whose last hex chars spell the name. Test authors can use any alias
 * (case-insensitive) as the case-level `caller` value; an empty/unset caller
 * falls back to `default`. Raw 0x-prefixed 40-hex addresses are also accepted.
 */
export const CALLER_ALIASES: Record<string, Address> = {
  default: createAddressFromString('0x000000000000000000000000000000000000c0de'),
  alice: createAddressFromString('0x00000000000000000000000000000000000a11ce'),
  bob: createAddressFromString('0x0000000000000000000000000000000000000b0b'),
  carol: createAddressFromString('0x00000000000000000000000000000000000ca201'),
  dave: createAddressFromString('0x000000000000000000000000000000000000dabe'),
}

export const DEFAULT_CALLER: Address = CALLER_ALIASES.default

const RAW_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

/**
 * Resolve an alias or raw hex address to an EVM `Address`. Empty/undefined yields
 * the default caller. Unknown names throw with the list of valid aliases so the
 * worker can surface the error per-case.
 */
export function resolveCaller(value: string | undefined | null): Address {
  if (value === undefined || value === null) return DEFAULT_CALLER
  const trimmed = value.trim()
  if (trimmed === '') return DEFAULT_CALLER
  const alias = CALLER_ALIASES[trimmed.toLowerCase()]
  if (alias) return alias
  if (RAW_ADDRESS_RE.test(trimmed)) return createAddressFromString(trimmed)
  const aliasList = Object.keys(CALLER_ALIASES).join(', ')
  throw new Error(
    `unknown caller "${value}"; expected one of [${aliasList}] or a 0x-prefixed 40-hex address`,
  )
}

const GAS_LIMIT = 0xffffffn

type Evm = Awaited<ReturnType<typeof createEVM>>

export interface RunReturnInput {
  kind: 'returnAssertion'
  bytecode: `0x${string}`
  abi: Abi
  fnAbi: AbiFunction
  constructorArgs?: unknown[]
  args: unknown[]
  valueWei?: string
  caller?: Address
}

export interface RunPostCheckInput {
  kind: 'postCheckAssertion'
  bytecode: `0x${string}`
  abi: Abi
  fnAbi: AbiFunction
  postCheckFnAbi: AbiFunction
  constructorArgs?: unknown[]
  args: unknown[]
  postCheckArgs: unknown[]
  valueWei?: string
  caller?: Address
  postCheckCaller?: Address
}

/**
 * One call inside a `sequence` test case. All steps share EVM state for the case; the
 * last step's return value (or a post-check view, depending on assertion kind) is the
 * comparison target.
 */
export interface RunSequenceStep {
  fnAbi: AbiFunction
  args: unknown[]
  valueWei?: string
  caller?: Address
}

export type RunSequenceAssertion =
  | { kind: 'lastReturn' }
  | { kind: 'postCheck'; fnAbi: AbiFunction; args: unknown[]; caller?: Address }

export interface RunSequenceInput {
  kind: 'sequence'
  bytecode: `0x${string}`
  abi: Abi
  constructorArgs?: unknown[]
  steps: RunSequenceStep[]
  assertion: RunSequenceAssertion
}

export type RunTestCaseInput = RunReturnInput | RunPostCheckInput | RunSequenceInput

/**
 * Runs one Solidity test case and returns the value that should be compared to `expected`.
 * Each call gets a fresh EVM so state doesn't leak between cases.
 */
export async function runTestCase(input: RunTestCaseInput): Promise<unknown> {
  const evm = await createEVM()
  const address = await deploy(evm, input.bytecode, input.abi, input.constructorArgs)

  if (input.kind === 'sequence') {
    return runSequence(evm, address, input)
  }

  const mainCaller = input.caller ?? DEFAULT_CALLER
  const mainReturn = await callMain(evm, address, input.fnAbi, input.args, input.valueWei, mainCaller)
  if (input.kind === 'postCheckAssertion') {
    return await callPostCheck(
      evm,
      address,
      input.postCheckFnAbi,
      input.postCheckArgs,
      input.postCheckCaller ?? mainCaller,
    )
  }
  return mainReturn
}

async function runSequence(evm: Evm, to: Address, input: RunSequenceInput): Promise<unknown> {
  if (input.steps.length === 0) {
    throw new Error('sequence has no steps')
  }
  let lastReturn: unknown = null
  let lastCaller: Address = DEFAULT_CALLER
  for (let i = 0; i < input.steps.length; i++) {
    const step = input.steps[i]
    lastCaller = step.caller ?? DEFAULT_CALLER
    try {
      lastReturn = await callMain(evm, to, step.fnAbi, step.args, step.valueWei, lastCaller)
    } catch (err) {
      const original = err instanceof Error ? err.message : String(err)
      // Rewrite "call reverted: ..." into "step N reverted: ..." so the case-level error
      // tells the author exactly which call in the chain failed.
      const stripped = original.replace(/^call reverted:\s*/, '')
      throw new Error(`step ${i + 1} (${step.fnAbi.name}) reverted: ${stripped}`)
    }
  }
  if (input.assertion.kind === 'lastReturn') return lastReturn
  return callPostCheck(
    evm,
    to,
    input.assertion.fnAbi,
    input.assertion.args,
    input.assertion.caller ?? lastCaller,
  )
}

async function deploy(
  evm: Evm,
  bytecode: `0x${string}`,
  abi: Abi,
  constructorArgs: unknown[] | undefined,
): Promise<Address> {
  const constructorAbi = abi.find((item) => item.type === 'constructor') as
    | { type: 'constructor'; inputs?: readonly { type: string }[] }
    | undefined
  const ctorInputs = constructorAbi?.inputs ?? []
  const coercedCtorArgs = constructorArgs ? coerceArgs(constructorArgs, ctorInputs) : []

  const deployData = encodeDeployData({
    abi: constructorAbi ? [constructorAbi as never] : [],
    bytecode,
    args: coercedCtorArgs as never,
  })

  const result = await evm.runCall({
    caller: DEFAULT_CALLER,
    data: hexToBytes(deployData),
    gasLimit: GAS_LIMIT,
    skipBalance: true,
  })

  if (result.execResult.exceptionError) {
    throw new Error(`deploy reverted: ${result.execResult.exceptionError.error}`)
  }
  if (!result.createdAddress) throw new Error('deploy did not produce a contract address')
  return result.createdAddress as Address
}

async function callMain(
  evm: Evm,
  to: Address,
  fnAbi: AbiFunction,
  args: unknown[],
  valueWei: string | undefined,
  caller: Address,
): Promise<unknown> {
  const inputs = (fnAbi.inputs ?? []) as readonly { type: string }[]
  const coercedArgs = coerceArgs(args, inputs)
  const callData = encodeFunctionData({
    abi: [fnAbi],
    functionName: fnAbi.name,
    args: coercedArgs as never,
  })

  const result = await evm.runCall({
    caller,
    to,
    data: hexToBytes(callData),
    gasLimit: GAS_LIMIT,
    value: valueWei ? BigInt(valueWei) : 0n,
    skipBalance: true,
  })

  if (result.execResult.exceptionError) {
    throw new Error(`call reverted: ${result.execResult.exceptionError.error}`)
  }

  if (!fnAbi.outputs || fnAbi.outputs.length === 0) return null
  const decoded = decodeFunctionResult({
    abi: [fnAbi],
    functionName: fnAbi.name,
    data: bytesToHex(result.execResult.returnValue) as `0x${string}`,
  })
  return normalizeReturnValue(decoded)
}

async function callPostCheck(
  evm: Evm,
  to: Address,
  postFn: AbiFunction,
  args: unknown[],
  caller: Address,
): Promise<unknown> {
  const inputs = (postFn.inputs ?? []) as readonly { type: string }[]
  const coercedArgs = coerceArgs(args, inputs)
  const callData = encodeFunctionData({
    abi: [postFn],
    functionName: postFn.name,
    args: coercedArgs as never,
  })

  const result = await evm.runCall({
    caller,
    to,
    data: hexToBytes(callData),
    gasLimit: GAS_LIMIT,
    skipBalance: true,
    isStatic: true,
  })

  if (result.execResult.exceptionError) {
    throw new Error(`post-check reverted: ${result.execResult.exceptionError.error}`)
  }

  if (!postFn.outputs || postFn.outputs.length === 0) return null
  const decoded = decodeFunctionResult({
    abi: [postFn],
    functionName: postFn.name,
    data: bytesToHex(result.execResult.returnValue) as `0x${string}`,
  })
  return normalizeReturnValue(decoded)
}
