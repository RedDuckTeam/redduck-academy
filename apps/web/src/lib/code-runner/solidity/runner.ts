import SolWorker from './worker?worker'
import type {
  RunnerOptions,
  RunnerReport,
  RunnerResult,
  SolidityTestCase,
  SoliditySpec,
} from '../types'
import type { SolRunRequest, SolRunResponse, SolWorkerCase } from './worker'

export async function runSolidity(
  source: string,
  spec: SoliditySpec,
  testCases: SolidityTestCase[],
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
    rawConstructorArgs: spec.rawConstructorArgs,
    cases: testCases.map(toWorkerCase),
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
        input: tc.rawArgs,
        expected: tc.rawExpected,
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
        input: tc.rawArgs,
        expected: tc.rawExpected,
        error: 'no result returned',
        durationMs: 0,
      }
    }
    return {
      id: tc.id,
      passed: r.passed,
      input: tc.rawArgs,
      expected: r.expected ?? tc.rawExpected,
      got: r.got,
      error: r.error,
      durationMs: 0,
    }
  })

  return {
    allPassed: results.every((r) => r.passed),
    results,
  }
}

function toWorkerCase(tc: SolidityTestCase): SolWorkerCase {
  if (tc.kind === 'returnAssertion') {
    return {
      id: tc.id,
      kind: 'returnAssertion',
      functionName: tc.functionName,
      rawArgs: tc.rawArgs,
      valueWei: tc.valueWei,
      caller: tc.caller,
      rawExpected: tc.rawExpected,
    }
  }
  return {
    id: tc.id,
    kind: 'postCheckAssertion',
    functionName: tc.functionName,
    rawArgs: tc.rawArgs,
    valueWei: tc.valueWei,
    caller: tc.caller,
    postCheckFunctionName: tc.postCheckFunctionName,
    rawPostCheckArgs: tc.rawPostCheckArgs,
    postCheckCaller: tc.postCheckCaller,
    rawExpected: tc.rawExpected,
  }
}
