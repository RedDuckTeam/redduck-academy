import type { RunnerResult } from '@/lib/code-runner'

export type CaseStatus = 'pass' | 'fail' | 'pending' | 'idle'

export function toArgArray(input: unknown): unknown[] {
  if (input === undefined) return []
  if (Array.isArray(input)) return input
  return [input]
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
