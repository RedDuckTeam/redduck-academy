import TsWorker from './worker?worker'
import type { RunnerOptions, RunnerReport, RunnerResult, TsTestCase, TsRunnerSpec } from '../types'
import { deepEqual } from '../compare'
import type { TsRunRequest, TsRunResponse } from './worker'

interface PendingTest {
  id: string
  resolve: (resp: TsRunResponse) => void
  timer: ReturnType<typeof setTimeout>
}

export async function runTypeScript(
  code: string,
  spec: TsRunnerSpec,
  testCases: TsTestCase[],
  opts: Required<Pick<RunnerOptions, 'perTestTimeoutMs' | 'totalTimeoutMs'>>,
): Promise<RunnerReport> {
  const worker = new TsWorker()
  const pending = new Map<string, PendingTest>()

  worker.onmessage = (event: MessageEvent<TsRunResponse>) => {
    const resp = event.data
    const slot = pending.get(resp.id)
    if (!slot) return
    clearTimeout(slot.timer)
    pending.delete(resp.id)
    slot.resolve(resp)
  }

  const startedAt = Date.now()
  const results: RunnerResult[] = []
  let fatalError: string | undefined

  const runOne = (tc: TsTestCase): Promise<TsRunResponse> =>
    new Promise<TsRunResponse>((resolve) => {
      const req: TsRunRequest = {
        type: 'run',
        id: tc.id,
        code,
        functionName: spec.functionName,
        input: tc.input,
      }
      const timer = setTimeout(() => {
        pending.delete(tc.id)
        resolve({ type: 'result', id: tc.id, ok: false, error: 'timeout' })
      }, opts.perTestTimeoutMs)
      pending.set(tc.id, { id: tc.id, resolve, timer })
      worker.postMessage(req)
    })

  try {
    for (let i = 0; i < testCases.length; i++) {
      if (Date.now() - startedAt > opts.totalTimeoutMs) {
        fatalError = 'total time limit exceeded'
        break
      }

      const tc = testCases[i]
      const t0 = performance.now()
      const resp = await runOne(tc)
      const durationMs = performance.now() - t0

      const got = resp.ok ? resp.got : undefined
      const passed = resp.ok ? deepEqual(got, tc.expected) : false
      results.push({
        id: tc.id,
        passed,
        input: tc.input,
        expected: tc.expected,
        got,
        error: resp.ok ? undefined : resp.error,
        durationMs,
      })

      if (resp.error === 'timeout') {
        // Worker may still be busy — terminate to recover.
        worker.terminate()
        break
      }
    }
  } finally {
    worker.terminate()
  }

  return {
    allPassed: results.length === testCases.length && results.every((r) => r.passed),
    results,
    fatalError,
  }
}
