import type { ExecutableTestCase } from '@/types/lesson'
import type { PostCheck, RunnerTestCase } from '@/lib/code-runner'

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function parsePostCheck(raw: string | null | undefined): PostCheck | undefined {
  if (!raw || !raw.trim()) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as { signature?: unknown }).signature !== 'string' ||
    !Array.isArray((parsed as { args?: unknown }).args)
  ) {
    return undefined
  }
  return parsed as PostCheck
}

function parseValueWei(raw: string | null | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined
  return raw.trim()
}

/**
 * Parses Payload's wire shape (`inputJson`/`expectedJson`/`valueWei`/`postCheckJson` strings)
 * into the runner-ready shape. Use this anywhere a parsed value is needed.
 */
export function parseExecutableCases(cases: ExecutableTestCase[] | undefined | null): RunnerTestCase[] {
  if (!cases || cases.length === 0) return []
  return cases.map((c) => ({
    id: c.id,
    input: safeParseJson(c.inputJson ?? ''),
    expected: safeParseJson(c.expectedJson ?? ''),
    valueWei: parseValueWei(c.valueWei),
    postCheck: parsePostCheck(c.postCheckJson),
  }))
}
