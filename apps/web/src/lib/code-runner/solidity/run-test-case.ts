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
import { deepEqual } from '../compare'

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

/**
 * Lowercased alias → canonical 0x hex string. Used by the worker to expand alias
 * names typed in `address`-typed function args (e.g. `alice` becomes the EOA hex
 * before `parseTypedValue` sees it).
 */
const ALIAS_HEX: Record<string, `0x${string}`> = Object.fromEntries(
  Object.entries(CALLER_ALIASES).map(([k, v]) => [k, v.toString() as `0x${string}`]),
)

/**
 * If `value` is a known alias name (case-insensitive, optional leading `@`),
 * returns the corresponding 0x-prefixed hex address. Otherwise returns the input
 * unchanged so downstream parsers can validate it (or fail with a hex error).
 *
 * The leading-`@` form is accepted now so it stays consistent once fixture
 * aliases (`@mockToken`) land. Today, both `alice` and `@alice` resolve.
 */
export function expandAddressAlias(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '') return value
  const key = (trimmed.startsWith('@') ? trimmed.slice(1) : trimmed).toLowerCase()
  return ALIAS_HEX[key] ?? value
}

const GAS_LIMIT = 0xffffffn

type Evm = Awaited<ReturnType<typeof createEVM>>

/** One step inside a test case. Steps share EVM state; each may carry its own assertion. */
export interface RunCaseStep {
  fnAbi: AbiFunction
  args: unknown[]
  valueWei?: string
  caller?: Address
  /**
   * Decoded expected return value (already coerced via ABI by the worker). When set,
   * the runner decodes this step's return and compares via `deepEqual`. When unset,
   * the step is just executed; success means "did not revert".
   */
  expectedDecoded?: unknown
  /** True when this step's `expectedDecoded` was intentionally set (distinguishes undefined-as-value from "no assertion"). */
  hasExpected: boolean
}

export interface RunCaseInput {
  kind: 'case'
  bytecode: `0x${string}`
  abi: Abi
  constructorArgs?: unknown[]
  steps: RunCaseStep[]
}

export type RunTestCaseInput = RunCaseInput

/**
 * Outcome shape parallel to a single RunnerResult row. `expected` / `got` are
 * populated by the LAST step that had an assertion when everything passed, or by
 * the FIRST failing step when something failed. `error` is set when a step reverted
 * or an assertion mismatched. `failedStepIndex` is set whenever the failure can be
 * attributed to a specific step, so the UI can render the diff inline with that step.
 */
export interface RunCaseResult {
  passed: boolean
  failedStepIndex?: number
  expected?: unknown
  got?: unknown
  error?: string
}

/**
 * Runs one Solidity test case (a sequence of EVM calls sharing state). Each step
 * may optionally compare its decoded return against `expectedDecoded`. The case
 * stops at the first failing step.
 */
export async function runTestCase(input: RunCaseInput): Promise<RunCaseResult> {
  if (input.steps.length === 0) {
    return { passed: false, error: 'test case has no steps' }
  }

  const evm = await createEVM()
  const to = await deploy(evm, input.bytecode, input.abi, input.constructorArgs)

  let lastAssertion: { expected: unknown; got: unknown } | undefined
  for (let i = 0; i < input.steps.length; i++) {
    const step = input.steps[i]
    const caller = step.caller ?? DEFAULT_CALLER
    let got: unknown
    try {
      got = await callMain(evm, to, step.fnAbi, step.args, step.valueWei, caller)
    } catch (err) {
      const original = err instanceof Error ? err.message : String(err)
      const stripped = original.replace(/^call reverted:\s*/, '')
      return {
        passed: false,
        failedStepIndex: i,
        error: `step ${i + 1} (${step.fnAbi.name}) reverted: ${stripped}`,
      }
    }

    if (!step.hasExpected) continue

    const passed = deepEqual(got, step.expectedDecoded)
    if (!passed) {
      return {
        passed: false,
        failedStepIndex: i,
        expected: step.expectedDecoded,
        got,
        error: `step ${i + 1} (${step.fnAbi.name}): expected mismatch`,
      }
    }
    lastAssertion = { expected: step.expectedDecoded, got }
  }

  if (lastAssertion) {
    return { passed: true, expected: lastAssertion.expected, got: lastAssertion.got }
  }
  // No step had an assertion — every step ran without reverting. Surface that as a pass
  // without expected/got, so the UI just shows the calls without a phantom output.
  return { passed: true }
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

