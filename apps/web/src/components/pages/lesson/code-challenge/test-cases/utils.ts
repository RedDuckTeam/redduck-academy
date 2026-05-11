import type { RunnerResult, RunnerTestCase } from '@/lib/code-runner'

export type CaseStatus = 'pass' | 'fail' | 'pending' | 'idle'

export function toArgArray(input: unknown): unknown[] {
  if (input === undefined) return []
  if (Array.isArray(input)) return input
  return [input]
}

/** Display-friendly args for a runner test case (handles TS, single-call Solidity, and sequences). */
export function getDisplayArgs(tc: RunnerTestCase): unknown[] {
  if ('kind' in tc) {
    if (tc.kind === 'sequence') {
      return tc.steps.map((s) => ({ fn: s.functionName, args: s.rawArgs }))
    }
    return tc.rawArgs
  }
  return toArgArray(tc.input)
}

/** Display-friendly expected value for a runner test case. */
export function getDisplayExpected(tc: RunnerTestCase): unknown {
  if ('kind' in tc) return tc.rawExpected
  return tc.expected
}

export function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined'
  try {
    return JSON.stringify(value, jsonReplacer)
  } catch {
    return String(value)
  }
}

function jsonReplacer(_key: string, val: unknown) {
  return typeof val === 'bigint' ? val.toString() : val
}

export function resolveCaseStatus(result: RunnerResult | undefined, isRunning: boolean): CaseStatus {
  if (isRunning) return 'pending'
  if (!result) return 'idle'
  return result.passed ? 'pass' : 'fail'
}
