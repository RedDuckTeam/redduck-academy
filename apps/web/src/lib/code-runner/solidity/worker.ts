import type { Abi, AbiFunction } from 'viem'
import { compile, type CompiledContract, parseTypedValue } from '@redduck/solc-utils'
import { runTestCase } from './run-test-case'
import { normalizeReturnValue } from './abi-coerce'
import { deepEqual } from '../compare'

export type SolWorkerCase =
  | {
      id: string
      kind: 'returnAssertion'
      functionName: string
      rawArgs: string[]
      valueWei?: string
      rawExpected: string
    }
  | {
      id: string
      kind: 'postCheckAssertion'
      functionName: string
      rawArgs: string[]
      valueWei?: string
      postCheckFunctionName: string
      rawPostCheckArgs: string[]
      rawExpected: string
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
      const fnAbi = requireFunction(compiled.abi, tc.functionName)
      const args = parseArgs(tc.rawArgs, fnAbi)
      const expected = parseExpected(tc.rawExpected, fnAbi.outputs)

      let got: unknown
      if (tc.kind === 'returnAssertion') {
        got = await runTestCase({
          kind: 'returnAssertion',
          bytecode: compiled.bytecode,
          abi: compiled.abi,
          fnAbi,
          constructorArgs,
          args,
          valueWei: tc.valueWei,
        })
      } else {
        const postFn = requireFunction(compiled.abi, tc.postCheckFunctionName)
        const postArgs = parseArgs(tc.rawPostCheckArgs, postFn)
        const postExpected = parseExpected(tc.rawExpected, postFn.outputs)
        got = await runTestCase({
          kind: 'postCheckAssertion',
          bytecode: compiled.bytecode,
          abi: compiled.abi,
          fnAbi,
          postCheckFnAbi: postFn,
          constructorArgs,
          args,
          postCheckArgs: postArgs,
          valueWei: tc.valueWei,
        })
        // For postCheck the comparison target is the post-check fn's return type.
        const passed = deepEqual(got, postExpected)
        results.push({ id: tc.id, passed, got, expected: postExpected })
        continue
      }

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
