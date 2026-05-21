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
    fixtures: spec.fixtures ?? [],
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
        input: caseInput(tc),
        expected: lastExpectedOf(tc),
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
        input: caseInput(tc),
        expected: lastExpectedOf(tc),
        error: 'no result returned',
        durationMs: 0,
      }
    }
    return {
      id: tc.id,
      passed: r.passed,
      input: caseInput(tc),
      expected: r.expected ?? lastExpectedOf(tc),
      got: r.got,
      error: r.error,
      failedStepIndex: r.failedStepIndex,
      durationMs: 0,
    }
  })

  return {
    allPassed: results.every((r) => r.passed),
    results,
  }
}

/**
 * UI-facing `input` summary for a case. Used in both the fatal-error and per-case fallback
 * paths so users see something meaningful in the results table when a case has no runner output.
 */
function caseInput(tc: SolidityTestCase): unknown {
  return tc.steps.map((s) => ({ fn: s.functionName, args: s.rawArgs }))
}

/** Last asserting step's raw expected, surfaced as the case-level expected for display. */
function lastExpectedOf(tc: SolidityTestCase): string | undefined {
  let last: string | undefined
  for (const s of tc.steps) {
    if (s.rawExpected !== undefined && s.rawExpected !== '') last = s.rawExpected
  }
  return last
}

function toWorkerCase(tc: SolidityTestCase): SolWorkerCase {
  return {
    id: tc.id,
    kind: 'case',
    steps: tc.steps.map((s) => ({
      target: s.target,
      functionName: s.functionName,
      rawArgs: s.rawArgs,
      valueWei: s.valueWei,
      caller: s.caller,
      rawExpected: s.rawExpected,
      rawExpectedRevert: s.rawExpectedRevert,
    })),
  }
}
