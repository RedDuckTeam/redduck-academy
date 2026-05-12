import { createEVM } from '@ethereumjs/evm'
import { type Address, hexToBytes, bytesToHex, createAddressFromString } from '@ethereumjs/util'
import {
  decodeErrorResult,
  encodeFunctionData,
  decodeFunctionResult,
  encodeDeployData,
  type Abi,
  type AbiFunction,
} from 'viem'
import { parseTypedValue } from '@redduck/solc-utils'
import { coerceArgs, normalizeReturnValue } from './abi-coerce'
import { deepEqual } from '../compare'

/**
 * Named caller addresses for test cases. Each alias maps to a fixed 20-byte
 * address whose last hex chars spell the name. Tests reference them via
 * `@-prefixed` syntax (`@alice`); raw 0x-prefixed 40-hex addresses are also
 * accepted everywhere an address is expected.
 */
export const CALLER_ALIASES: Record<string, Address> = {
  deployer: createAddressFromString('0x000000000000000000000000000000000000c0de'),
  alice: createAddressFromString('0x00000000000000000000000000000000000a11ce'),
  bob: createAddressFromString('0x0000000000000000000000000000000000000b0b'),
  carol: createAddressFromString('0x00000000000000000000000000000000000ca201'),
  dave: createAddressFromString('0x000000000000000000000000000000000000dabe'),
}

export const DEFAULT_CALLER: Address = CALLER_ALIASES.deployer

const RAW_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

/**
 * Per-case map of `@alias` (lowercased name, no @) → Address. Seeded with EOA
 * aliases, extended with fixture aliases after each fixture deploys, and bound
 * to `self` after the student's contract deploys.
 */
export type AliasMap = Map<string, Address>

export function newCaseAliasMap(): AliasMap {
  const map: AliasMap = new Map()
  for (const [name, addr] of Object.entries(CALLER_ALIASES)) map.set(name, addr)
  return map
}

/**
 * Resolve an `@`-prefixed alias or a raw 0x hex string to an EVM Address.
 * Throws with a list of valid aliases when the lookup fails. Empty/undefined
 * is treated as "no value" by the caller — this helper expects a real input.
 */
export function resolveAddress(value: string, aliasMap: AliasMap): Address {
  const trimmed = value.trim()
  if (trimmed === '') {
    throw new Error('address required')
  }
  if (trimmed.startsWith('@')) {
    const key = trimmed.slice(1).toLowerCase()
    const hit = aliasMap.get(key)
    if (hit) return hit
    const known = Array.from(aliasMap.keys())
      .map((n) => `@${n}`)
      .join(', ')
    throw new Error(`unknown alias "${value}"; known: [${known}] or use a 0x-prefixed 40-hex address`)
  }
  if (RAW_ADDRESS_RE.test(trimmed)) return createAddressFromString(trimmed)
  throw new Error(
    `invalid address "${value}"; use an @-prefixed alias (e.g. @alice) or a 0x-prefixed 40-hex address`,
  )
}

/**
 * Like resolveAddress but returns DEFAULT_CALLER when value is empty/undefined.
 * Used for the step `caller` field where blank means "use the default EOA."
 */
export function resolveCaller(value: string | undefined | null, aliasMap: AliasMap): Address {
  if (value === undefined || value === null) return DEFAULT_CALLER
  const trimmed = value.trim()
  if (trimmed === '') return DEFAULT_CALLER
  return resolveAddress(trimmed, aliasMap)
}

/**
 * If `value` is `@-prefixed` and the alias resolves, return its 0x-hex form.
 * Otherwise return the input unchanged so downstream parsers can validate it
 * (or fail with a hex error). Used to substitute `@alias` in `address`-typed
 * args / constructor args before `parseTypedValue` sees them.
 */
export function expandAddressAlias(value: string, aliasMap: AliasMap): string {
  const trimmed = value.trim()
  if (!trimmed.startsWith('@')) return value
  const key = trimmed.slice(1).toLowerCase()
  const hit = aliasMap.get(key)
  return hit ? (hit.toString() as `0x${string}`) : value
}

const GAS_LIMIT = 0xffffffn

type Evm = Awaited<ReturnType<typeof createEVM>>

/** A peer contract deployed before the student's contract for the duration of a case. */
export interface RunFixture {
  /** Lowercased alias name (no @ prefix); becomes the key in the case's alias map. */
  alias: string
  abi: Abi
  bytecode: `0x${string}`
  rawConstructorArgs: string[]
  /** Constructor input types (from the fixture's own ABI). Used to coerce raw args. */
  ctorInputs: readonly { type: string }[]
}

/** One step inside a test case. Steps share EVM state; each may carry its own assertion. */
export interface RunCaseStep {
  fnAbi: AbiFunction
  /** ABI input types of `fnAbi`, pre-extracted so the runner can `parseTypedValue` raw args. */
  argInputs: readonly { type: string }[]
  rawArgs: string[]
  valueWei?: string
  /** Raw caller string ('@alice' / '@self' / 0x-hex / blank). Resolved at call time. */
  rawCaller?: string
  /** Raw target string ('@mockToken' / '@self' / blank). Defaults to '@self'. */
  target?: string
  /** Raw expected string. Decoded against `fnAbi.outputs` at compare time. */
  rawExpected?: string
  hasExpected: boolean
}

export interface RunCaseInput {
  kind: 'case'
  studentBytecode: `0x${string}`
  studentAbi: Abi
  studentRawConstructorArgs: string[]
  studentCtorInputs: readonly { type: string }[]
  fixtures: RunFixture[]
  steps: RunCaseStep[]
}

export type RunTestCaseInput = RunCaseInput

export interface RunCaseResult {
  passed: boolean
  failedStepIndex?: number
  expected?: unknown
  got?: unknown
  error?: string
}

/**
 * Runs one Solidity test case (a sequence of EVM calls sharing state).
 *
 * Per-case flow:
 *   1. fresh EVM
 *   2. deploy each fixture in declaration order, binding `@<alias>` to its address
 *   3. resolve and deploy the student's contract, bind `@self`
 *   4. execute each step routed to its `target` (defaults to `@self`); resolve
 *      `caller` and `@`-aliases in address args against the now-complete map
 *   5. assertion compare per step that sets `expected`
 *
 * Stops at the first failure (revert, mismatch, or resolution error).
 */
export async function runTestCase(input: RunCaseInput): Promise<RunCaseResult> {
  if (input.steps.length === 0) {
    return { passed: false, error: 'test case has no steps' }
  }

  const evm = await createEVM()
  const aliasMap = newCaseAliasMap()
  // Union of all ABIs in this case, used to decode revert payloads. Combining
  // student + every fixture means we can match custom-error selectors regardless
  // of which contract bubbled the revert up — OZ's `ERC20InsufficientBalance`,
  // for example, is in the ABI of any contract that inherits ERC20.
  const unionAbi: Abi = [...input.studentAbi, ...input.fixtures.flatMap((f) => f.abi)]

  // --- 1. fixtures, in declaration order
  for (const fixture of input.fixtures) {
    let ctorArgs: unknown[]
    try {
      ctorArgs = parseRawArgs(fixture.rawConstructorArgs, fixture.ctorInputs, aliasMap)
    } catch (err) {
      return { passed: false, error: `fixture '${fixture.alias}' constructor args: ${msg(err)}` }
    }
    let addr: Address
    try {
      addr = await deploy(evm, fixture.bytecode, fixture.abi, ctorArgs, unionAbi)
    } catch (err) {
      return { passed: false, error: `fixture '${fixture.alias}' deploy failed: ${msg(err)}` }
    }
    aliasMap.set(fixture.alias.toLowerCase(), addr)
  }

  // --- 2. student's contract
  let studentArgs: unknown[]
  try {
    studentArgs = parseRawArgs(input.studentRawConstructorArgs, input.studentCtorInputs, aliasMap)
  } catch (err) {
    return { passed: false, error: `student constructor args: ${msg(err)}` }
  }
  let studentAddr: Address
  try {
    studentAddr = await deploy(evm, input.studentBytecode, input.studentAbi, studentArgs, unionAbi)
  } catch (err) {
    return { passed: false, error: `student deploy failed: ${msg(err)}` }
  }
  aliasMap.set('self', studentAddr)

  // --- 3. steps
  let lastAssertion: { expected: unknown; got: unknown } | undefined
  for (let i = 0; i < input.steps.length; i++) {
    const step = input.steps[i]
    let targetAddr: Address
    let callerAddr: Address
    let argValues: unknown[]
    try {
      targetAddr = step.target ? resolveAddress(step.target, aliasMap) : studentAddr
      callerAddr = resolveCaller(step.rawCaller, aliasMap)
      argValues = parseRawArgs(step.rawArgs, step.argInputs, aliasMap)
    } catch (err) {
      return {
        passed: false,
        failedStepIndex: i,
        error: `step ${i + 1} (${step.fnAbi.name}): ${msg(err)}`,
      }
    }

    let got: unknown
    try {
      got = await callContract(evm, targetAddr, step.fnAbi, argValues, step.valueWei, callerAddr, unionAbi)
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

    let expectedDecoded: unknown
    try {
      expectedDecoded = parseExpected(step.rawExpected ?? '', step.fnAbi.outputs ?? [], aliasMap)
    } catch (err) {
      return {
        passed: false,
        failedStepIndex: i,
        error: `step ${i + 1} (${step.fnAbi.name}) expected: ${msg(err)}`,
      }
    }

    if (!deepEqual(got, expectedDecoded)) {
      return {
        passed: false,
        failedStepIndex: i,
        expected: expectedDecoded,
        got,
        error: `step ${i + 1} (${step.fnAbi.name}): expected mismatch`,
      }
    }
    lastAssertion = { expected: expectedDecoded, got }
  }

  return lastAssertion
    ? { passed: true, expected: lastAssertion.expected, got: lastAssertion.got }
    : { passed: true }
}

function msg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Coerce raw arg strings to decoded JS values per ABI input types. Substitutes
 * `@alias` for the resolved hex address when the slot is `address`-typed.
 */
function parseRawArgs(
  raw: string[],
  inputs: readonly { type: string }[],
  aliasMap: AliasMap,
): unknown[] {
  if (raw.length !== inputs.length) {
    throw new Error(`expected ${inputs.length} arg(s), got ${raw.length}`)
  }
  return raw.map((value, i) => {
    const type = inputs[i].type
    const prepared =
      type === 'address' || type.startsWith('address ') ? expandAddressAlias(value, aliasMap) : value
    return parseTypedValue(prepared, type)
  })
}

/**
 * Parse a raw `expected` string against the function's output type(s).
 * Mirrors the logic that used to live in worker.ts, now alias-aware so an
 * expected like `@mockToken` can match an address-returning view.
 */
function parseExpected(
  raw: string,
  outputs: readonly { type: string }[],
  aliasMap: AliasMap,
): unknown {
  if (outputs.length === 0) return null
  if (outputs.length === 1) {
    const type = outputs[0].type
    const prepared =
      type === 'address' || type.startsWith('address ') ? expandAddressAlias(raw, aliasMap) : raw
    const parsed = parseTypedValue(prepared, type)
    return normalizeReturnValue(parsed)
  }
  let arr: unknown
  try {
    arr = JSON.parse(raw)
  } catch {
    throw new Error('Expected JSON array for multi-output return value')
  }
  if (!Array.isArray(arr) || arr.length !== outputs.length) {
    throw new Error(`Expected JSON array of length ${outputs.length}`)
  }
  return normalizeReturnValue(
    arr.map((v, i) => {
      const type = outputs[i].type
      const raw = typeof v === 'string' ? v : JSON.stringify(v)
      const prepared =
        type === 'address' || type.startsWith('address ') ? expandAddressAlias(raw, aliasMap) : raw
      return parseTypedValue(prepared, type)
    }),
  )
}

async function deploy(
  evm: Evm,
  bytecode: `0x${string}`,
  abi: Abi,
  constructorArgs: unknown[] | undefined,
  unionAbi: Abi,
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
    const reason = formatRevertReason(
      result.execResult.returnValue,
      result.execResult.exceptionError.error,
      unionAbi,
    )
    throw new Error(`deploy reverted: ${reason}`)
  }
  if (!result.createdAddress) throw new Error('deploy did not produce a contract address')
  return result.createdAddress as Address
}

async function callContract(
  evm: Evm,
  to: Address,
  fnAbi: AbiFunction,
  args: unknown[],
  valueWei: string | undefined,
  caller: Address,
  unionAbi: Abi,
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
    const reason = formatRevertReason(
      result.execResult.returnValue,
      result.execResult.exceptionError.error,
      unionAbi,
    )
    throw new Error(`call reverted: ${reason}`)
  }

  if (!fnAbi.outputs || fnAbi.outputs.length === 0) return null
  const decoded = decodeFunctionResult({
    abi: [fnAbi],
    functionName: fnAbi.name,
    data: bytesToHex(result.execResult.returnValue) as `0x${string}`,
  })
  return normalizeReturnValue(decoded)
}

/**
 * Decode a revert payload against the case's union ABI and return a readable
 * reason string. Falls back to the EVM's generic error label (e.g. "revert",
 * "out of gas") when the returnValue isn't a recognized error shape.
 *
 * Built-in handlers always work: `Error(string)` (require/revert with message)
 * and `Panic(uint256)` (arithmetic, assertions). Custom errors from OZ or the
 * user's own contracts decode when the relevant definition lives in `unionAbi`,
 * which we build per-case from the student's contract + every fixture's ABI.
 */
function formatRevertReason(returnValue: Uint8Array, fallback: string, unionAbi: Abi): string {
  if (returnValue.length === 0) return fallback
  const data = bytesToHex(returnValue) as `0x${string}`
  try {
    const decoded = decodeErrorResult({ abi: unionAbi, data })
    return formatDecodedError(decoded.errorName, (decoded.args ?? []) as readonly unknown[])
  } catch {
    // Couldn't decode against any known ABI — surface the raw payload so the
    // author can at least pattern-match the selector (first 4 bytes).
    const preview = data.length > 18 ? `${data.slice(0, 18)}…` : data
    return `${fallback} (data=${preview})`
  }
}

function formatDecodedError(name: string, args: readonly unknown[]): string {
  if (name === 'Error') return String(args[0] ?? '')
  if (name === 'Panic') return `Panic(${formatErrorArg(args[0])})`
  if (args.length === 0) return name
  return `${name}(${args.map(formatErrorArg).join(', ')})`
}

function formatErrorArg(value: unknown): string {
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return `[${value.map(formatErrorArg).join(', ')}]`
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
    } catch {
      return String(value)
    }
  }
  return String(value)
}
