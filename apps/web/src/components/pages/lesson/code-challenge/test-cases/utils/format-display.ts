import type { RunnerTestCase } from '@/lib/code-runner'

export function toArgArray(input: unknown): unknown[] {
  if (input === undefined) return []
  if (Array.isArray(input)) return input
  return [input]
}

/** Display-friendly args for a runner test case (handles TS and Solidity case-shape). */
export function getDisplayArgs(tc: RunnerTestCase): unknown[] {
  if ('kind' in tc) {
    return tc.steps.map((s) => ({ fn: s.functionName, args: s.rawArgs }))
  }
  return toArgArray(tc.input)
}

/**
 * Display-friendly expected value for a runner test case. For Solidity cases we
 * surface the LAST asserting step's expected as the case-level Output — matches
 * what the runner returns as `expected` when all steps pass.
 */
export function getDisplayExpected(tc: RunnerTestCase): unknown {
  if ('kind' in tc) {
    let last: string | undefined
    for (const s of tc.steps) {
      if (s.rawExpected !== undefined && s.rawExpected !== '') last = s.rawExpected
    }
    return last
  }
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
