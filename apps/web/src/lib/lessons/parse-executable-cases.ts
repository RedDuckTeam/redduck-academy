import type { ExecutableTestCase, Lesson, SolidityTestCase as WireSolidityCase } from '@/types/lesson'
import type { RunnerTestCase, SolidityTestCase, TsTestCase } from '@/lib/code-runner'

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

/** TS path: parse `inputJson`/`expectedJson` strings into runner-ready cases. */
export function parseTsTestCases(cases: ExecutableTestCase[] | undefined | null): TsTestCase[] {
  if (!cases || cases.length === 0) return []
  return cases.map((c) => ({
    id: c.id,
    input: safeParseJson(c.inputJson ?? ''),
    expected: safeParseJson(c.expectedJson ?? ''),
  }))
}

/**
 * Solidity path: convert Payload's `solidityTestCases` array rows into runner-ready
 * cases. Raw string values flow through unchanged — the worker coerces them via the
 * compiled ABI to keep both authoring and execution honest about type mismatch.
 */
export function parseSolidityTestCases(cases: WireSolidityCase[] | undefined | null): SolidityTestCase[] {
  if (!cases || cases.length === 0) return []
  return cases.map((c) => ({
    id: c.id,
    kind: 'case' as const,
    steps: (c.steps ?? []).map((s) => {
      const valueWei = s.valueWei && s.valueWei.trim() !== '' ? s.valueWei.trim() : undefined
      const caller = s.caller && s.caller.trim() !== '' ? s.caller.trim() : undefined
      const target = s.target && s.target.trim() !== '' ? s.target.trim() : undefined
      const rawExpected = s.expected != null && s.expected.trim() !== '' ? s.expected : undefined
      return {
        target,
        functionName: s.functionName,
        rawArgs: (s.args ?? []).map((a) => a.value ?? ''),
        valueWei,
        caller,
        rawExpected,
      }
    }),
  }))
}

/**
 * Single entry point — returns the runner-ready cases for whichever language path
 * the lesson uses. Callers that need the wire shape directly can still hit the
 * specialized parsers above.
 */
export function parseLessonTestCases(lesson: Lesson): RunnerTestCase[] {
  if (lesson.codingLanguage === 'solidity') {
    return parseSolidityTestCases(lesson.solidityTestCases)
  }
  return parseTsTestCases(lesson.executableTestCases)
}
