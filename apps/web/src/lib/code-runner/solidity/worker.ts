import { parseAbiItem, type AbiFunction } from 'viem'
import type { PostCheck } from '../types'
import { compile, type CompiledContract } from './compile'
import { runTestCase } from './run-test-case'

export interface SolWorkerCase {
  id: string
  input: unknown
  valueWei?: string
  postCheck?: PostCheck
}

export interface SolRunRequest {
  type: 'compile-and-run'
  source: string
  contractName?: string
  functionSignature: string
  constructorArgs?: unknown[]
  cases: SolWorkerCase[]
}

export interface SolRunResponse {
  type: 'result'
  fatalError?: string
  results: Array<{ id: string; ok: boolean; got?: unknown; error?: string }>
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

  let fnAbi: AbiFunction
  try {
    const parsed = parseAbiItem(msg.functionSignature)
    if (parsed.type !== 'function') throw new Error('Function signature must declare a function')
    fnAbi = parsed
  } catch (err) {
    respond({ type: 'result', results: [], fatalError: `Bad function signature: ${errorMessage(err)}` })
    return
  }

  const results: SolRunResponse['results'] = []
  for (const tc of msg.cases) {
    try {
      const args = Array.isArray(tc.input) ? tc.input : [tc.input]
      const got = await runTestCase({
        bytecode: compiled.bytecode,
        abi: compiled.abi,
        fnAbi,
        constructorArgs: msg.constructorArgs,
        args,
        valueWei: tc.valueWei,
        postCheck: tc.postCheck,
      })
      results.push({ id: tc.id, ok: true, got })
    } catch (err) {
      results.push({ id: tc.id, ok: false, error: errorMessage(err) })
    }
  }
  respond({ type: 'result', results })
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
