import type { Abi, AbiFunction } from 'viem'
import { compile, type CompiledContract, parseTypedValue } from '@redduck/solc-utils'
import { expandAddressAlias, resolveCaller, runTestCase, type RunCaseStep } from './run-test-case'
import { normalizeReturnValue } from './abi-coerce'

/** Per-case hard cap on the number of steps. Mirrors Payload-side validation. */
const MAX_CASE_STEPS = 16

export interface SolWorkerStep {
  functionName: string
  rawArgs: string[]
  valueWei?: string
  caller?: string
  rawExpected?: string
}

export interface SolWorkerCase {
  id: string
  kind: 'case'
  steps: SolWorkerStep[]
}

export interface SolRunRequest {
  type: 'compile-and-run'
  source: string
  contractName?: string
  rawConstructorArgs?: string[]
  cases: SolWorkerCase[]
}

export interface SolRunResponse {
  type: 'result'
  fatalError?: string
  results: Array<{
    id: string
    passed: boolean
    failedStepIndex?: number
    got?: unknown
    expected?: unknown
    error?: string
  }>
}

self.onmessage = async (event: MessageEvent<SolRunRequest>) => {
  const msg = event.data
  if (msg?.type !== 'compile-and-run') return
  const respond = (resp: SolRunResponse) => (self as unknown as Worker).postMessage(resp)

  let compiled: CompiledContract
  try {
    compiled = await compile(msg.source, msg.contractName)
  } catch (err) {
    respond({ type: 'result', results: [], fatalError: errorMessage(err) })
    return
  }

  let constructorArgs: unknown[] | undefined
  try {
    constructorArgs = msg.rawConstructorArgs && msg.rawConstructorArgs.length > 0
      ? coerceConstructorArgs(compiled.abi, msg.rawConstructorArgs)
      : undefined
  } catch (err) {
    respond({ type: 'result', results: [], fatalError: `constructor args: ${errorMessage(err)}` })
    return
  }

  const results: SolRunResponse['results'] = []
  for (const tc of msg.cases) {
    try {
      if (tc.steps.length === 0) throw new Error('test case has no steps')
      if (tc.steps.length > MAX_CASE_STEPS) {
        throw new Error(`test case exceeds ${MAX_CASE_STEPS}-step cap`)
      }
      const resolvedSteps: RunCaseStep[] = tc.steps.map((step, i) => {
        const fnAbi = requireFunction(compiled.abi, step.functionName)
        const hasExpected = step.rawExpected !== undefined && step.rawExpected !== null && step.rawExpected !== ''
        return {
          fnAbi,
          args: parseArgs(step.rawArgs, fnAbi),
          valueWei: step.valueWei,
          caller: step.caller ? resolveCallerLabeled(step.caller, `step ${i + 1}`) : undefined,
          hasExpected,
          expectedDecoded: hasExpected ? parseExpected(step.rawExpected!, fnAbi.outputs) : undefined,
        }
      })

      const outcome = await runTestCase({
        kind: 'case',
        bytecode: compiled.bytecode,
        abi: compiled.abi,
        constructorArgs,
        steps: resolvedSteps,
      })
      results.push({
        id: tc.id,
        passed: outcome.passed,
        failedStepIndex: outcome.failedStepIndex,
        got: outcome.got,
        expected: outcome.expected,
        error: outcome.error,
      })
    } catch (err) {
      results.push({ id: tc.id, passed: false, error: errorMessage(err) })
    }
  }
  respond({ type: 'result', results })
}

function requireFunction(abi: Abi, name: string): AbiFunction {
  const fn = abi.find((item): item is AbiFunction => item.type === 'function' && item.name === name)
  if (!fn) throw new Error(`function "${name}" not found in compiled ABI`)
  return fn
}

function parseArgs(raw: string[], fnAbi: AbiFunction): unknown[] {
  const inputs = fnAbi.inputs ?? []
  if (raw.length !== inputs.length) {
    throw new Error(
      `${fnAbi.name}: expected ${inputs.length} arg(s), got ${raw.length}`,
    )
  }
  return raw.map((value, i) => parseTypedValue(prepareArgValue(value, inputs[i].type), inputs[i].type))
}

/**
 * Substitute alias names for their resolved hex when the argument is typed `address`.
 * `address[]` and address-bearing tuples are left untouched — those still require
 * hex literals for now. (If you hit a real need for `["alice", "bob"]` style arrays,
 * extend this to JSON-walk the value.)
 */
function prepareArgValue(value: string, abiType: string): string {
  if (abiType === 'address' || abiType.startsWith('address ')) {
    return expandAddressAlias(value)
  }
  return value
}

function parseExpected(raw: string, outputs: readonly { type: string }[] | undefined): unknown {
  if (!outputs || outputs.length === 0) return null
  if (outputs.length === 1) {
    const parsed = parseTypedValue(raw, outputs[0].type)
    return normalizeReturnValue(parsed)
  }
  // Multiple outputs — admin types a JSON array; each element parsed against its type.
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
    arr.map((v, i) => parseTypedValue(typeof v === 'string' ? v : JSON.stringify(v), outputs[i].type)),
  )
}

function coerceConstructorArgs(abi: Abi, raw: string[]): unknown[] {
  const ctor = abi.find(
    (item): item is Extract<Abi[number], { type: 'constructor' }> => item.type === 'constructor',
  )
  const inputs = ctor?.inputs ?? []
  if (raw.length !== inputs.length) {
    throw new Error(`constructor: expected ${inputs.length} arg(s), got ${raw.length}`)
  }
  return raw.map((value, i) => parseTypedValue(prepareArgValue(value, inputs[i].type), inputs[i].type))
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Resolve a caller alias/address and prefix any failure with a label so multi-step
 * cases point the author at the exact step that had the bad value.
 */
function resolveCallerLabeled(value: string, label: string): ReturnType<typeof resolveCaller> {
  try {
    return resolveCaller(value)
  } catch (err) {
    throw new Error(`${label}: ${err instanceof Error ? err.message : String(err)}`)
  }
}
