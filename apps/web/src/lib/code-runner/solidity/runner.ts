import SolWorker from './worker?worker'
import type { RunnerOptions, RunnerReport, RunnerResult, RunnerTestCase, SoliditySpec } from '../types'
import { deepEqual } from '../compare'
import type { SolRunRequest, SolRunResponse } from './worker'

export async function runSolidity(
  source: string,
  spec: SoliditySpec,
  testCases: RunnerTestCase[],
  opts: Required<Pick<RunnerOptions, 'perTestTimeoutMs' | 'totalTimeoutMs'>>,
): Promise<RunnerReport> {
  const worker = new SolWorker()

  const totalTimeout = Math.max(opts.totalTimeoutMs, opts.perTestTimeoutMs * testCases.length + 30_000)

  const responsePromise = new Promise<SolRunResponse>((resolve) => {
    worker.onmessage = (event: MessageEvent<SolRunResponse>) => {
      resolve(event.data)
    }
  })

  const timeoutPromise = new Promise<SolRunResponse>((resolve) => {
    setTimeout(
      () =>
        resolve({
          type: 'result',
          results: [],
          fatalError: 'Solidity runner timed out (compile + tests)',
        }),
      totalTimeout,
    )
  })

  const req: SolRunRequest = {
    type: 'compile-and-run',
    source,
    contractName: spec.contractName,
    functionSignature: spec.functionSignature,
    constructorArgs: spec.constructorArgs,
    cases: testCases.map((tc) => ({
      id: tc.id,
      input: tc.input,
      valueWei: tc.valueWei,
      postCheck: tc.postCheck,
    })),
  }

  worker.postMessage(req)

  const response = await Promise.race([responsePromise, timeoutPromise])
  worker.terminate()

  if (response.fatalError) {
    return {
      allPassed: false,
      results: testCases.map((tc) => ({
        id: tc.id,
        passed: false,
        input: tc.input,
        expected: tc.expected,
        error: response.fatalError,
        durationMs: 0,
      })),
      fatalError: response.fatalError,
    }
  }

  const byId = new Map(response.results.map((r) => [r.id, r]))
  const results: RunnerResult[] = testCases.map((tc) => {
    const r = byId.get(tc.id)
    if (!r) {
      return {
        id: tc.id,
        passed: false,
        input: tc.input,
        expected: tc.expected,
        error: 'no result returned',
        durationMs: 0,
      }
    }
    const passed = r.ok && deepEqual(r.got, tc.expected)
    return {
      id: tc.id,
      passed,
      input: tc.input,
      expected: tc.expected,
      got: r.ok ? r.got : undefined,
      error: r.ok ? undefined : r.error,
      durationMs: 0,
    }
  })

  return {
    allPassed: results.every((r) => r.passed),
    results,
  }
}
