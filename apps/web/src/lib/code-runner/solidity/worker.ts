import type { Abi, AbiFunction } from 'viem'
import { compile, type CompiledContract, parseTypedValue } from '@redduck/solc-utils'
import { resolveCaller, runTestCase, type RunSequenceAssertion } from './run-test-case'
import { normalizeReturnValue } from './abi-coerce'
import { deepEqual } from '../compare'

export interface SolWorkerStep {
  functionName: string
  rawArgs: string[]
  valueWei?: string
  caller?: string
}

export type SolWorkerCase =
  | {
      id: string
      kind: 'returnAssertion'
      functionName: string
      rawArgs: string[]
      valueWei?: string
      caller?: string
      rawExpected: string
    }
  | {
      id: string
      kind: 'postCheckAssertion'
      functionName: string
      rawArgs: string[]
      valueWei?: string
      caller?: string
      postCheckFunctionName: string
      rawPostCheckArgs: string[]
      postCheckCaller?: string
      rawExpected: string
    }
  | {
      id: string
      kind: 'sequence'
      steps: SolWorkerStep[]
      assertion: 'lastReturn' | 'postCheck'
      postCheckFunctionName?: string
      rawPostCheckArgs?: string[]
      postCheckCaller?: string
      rawExpected: string
    }

/** Per-case hard cap on the number of steps in a sequence; mirrors Payload-side validation. */
const MAX_SEQUENCE_STEPS = 16

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
      if (tc.kind === 'returnAssertion') {
        const fnAbi = requireFunction(compiled.abi, tc.functionName)
        const args = parseArgs(tc.rawArgs, fnAbi)
        const expected = parseExpected(tc.rawExpected, fnAbi.outputs)
        const caller = resolveCaller(tc.caller)
        const got = await runTestCase({
          kind: 'returnAssertion',
          bytecode: compiled.bytecode,
          abi: compiled.abi,
          fnAbi,
          constructorArgs,
          args,
          valueWei: tc.valueWei,
          caller,
        })
        const passed = deepEqual(got, expected)
        results.push({ id: tc.id, passed, got, expected })
        continue
      }

      if (tc.kind === 'postCheckAssertion') {
        const fnAbi = requireFunction(compiled.abi, tc.functionName)
        const args = parseArgs(tc.rawArgs, fnAbi)
        const caller = resolveCaller(tc.caller)
        const postFn = requireFunction(compiled.abi, tc.postCheckFunctionName)
        const postArgs = parseArgs(tc.rawPostCheckArgs, postFn)
        const postExpected = parseExpected(tc.rawExpected, postFn.outputs)
        const postCheckCaller = tc.postCheckCaller ? resolveCaller(tc.postCheckCaller) : undefined
        const got = await runTestCase({
          kind: 'postCheckAssertion',
          bytecode: compiled.bytecode,
          abi: compiled.abi,
          fnAbi,
          postCheckFnAbi: postFn,
          constructorArgs,
          args,
          postCheckArgs: postArgs,
          valueWei: tc.valueWei,
          caller,
          postCheckCaller,
        })
        // For postCheck the comparison target is the post-check fn's return type.
        const passed = deepEqual(got, postExpected)
        results.push({ id: tc.id, passed, got, expected: postExpected })
        continue
      }

      // tc.kind === 'sequence'
      if (tc.steps.length === 0) throw new Error('sequence has no steps')
      if (tc.steps.length > MAX_SEQUENCE_STEPS) {
        throw new Error(`sequence exceeds ${MAX_SEQUENCE_STEPS}-step cap`)
      }
      const resolvedSteps = tc.steps.map((step, i) => {
        const fnAbi = requireFunction(compiled.abi, step.functionName)
        return {
          fnAbi,
          args: parseArgs(step.rawArgs, fnAbi),
          valueWei: step.valueWei,
          caller: step.caller ? resolveCallerLabeled(step.caller, `step ${i + 1}`) : undefined,
        }
      })
      const lastFnAbi = resolvedSteps[resolvedSteps.length - 1].fnAbi
      let assertion: RunSequenceAssertion
      let expected: unknown
      if (tc.assertion === 'lastReturn') {
        assertion = { kind: 'lastReturn' }
        expected = parseExpected(tc.rawExpected, lastFnAbi.outputs)
      } else {
        if (!tc.postCheckFunctionName) {
          throw new Error('sequence assertion=postCheck requires postCheckFunctionName')
        }
        const postFn = requireFunction(compiled.abi, tc.postCheckFunctionName)
        const postArgs = parseArgs(tc.rawPostCheckArgs ?? [], postFn)
        assertion = {
          kind: 'postCheck',
          fnAbi: postFn,
          args: postArgs,
          caller: tc.postCheckCaller ? resolveCallerLabeled(tc.postCheckCaller, 'postCheckCaller') : undefined,
        }
        expected = parseExpected(tc.rawExpected, postFn.outputs)
      }
      const got = await runTestCase({
        kind: 'sequence',
        bytecode: compiled.bytecode,
        abi: compiled.abi,
        constructorArgs,
        steps: resolvedSteps,
        assertion,
      })
      const passed = deepEqual(got, expected)
      results.push({ id: tc.id, passed, got, expected })
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
  return raw.map((value, i) => parseTypedValue(value, inputs[i].type))
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
  return raw.map((value, i) => parseTypedValue(value, inputs[i].type))
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Resolve a caller alias/address and prefix any failure with a label so multi-step
 * cases point the author at the exact step (or post-check) that had the bad value.
 */
function resolveCallerLabeled(value: string, label: string): ReturnType<typeof resolveCaller> {
  try {
    return resolveCaller(value)
  } catch (err) {
    throw new Error(`${label}: ${err instanceof Error ? err.message : String(err)}`)
  }
}
