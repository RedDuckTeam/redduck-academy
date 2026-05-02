import { createHash } from 'crypto'
import type { SecondLayerCase } from '../prompt.builder'
import { safeParseJson } from './safe-parse-json'

export interface ExecutableCaseRow {
  inputJson?: string | null
  expectedJson?: string | null
  valueWei?: string | null
  postCheckJson?: string | null
}

function parsePostCheck(raw: string | null | undefined): SecondLayerCase['postCheck'] {
  if (!raw || !raw.trim()) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as { signature?: unknown }).signature !== 'string' ||
    !Array.isArray((parsed as { args?: unknown }).args)
  ) {
    return null
  }
  return parsed as SecondLayerCase['postCheck']
}

/** Convert Payload's wire shape into the rich case shape consumed by the AI prompt. */
export function deserializeExecutableCases(rows: ExecutableCaseRow[] | undefined | null): SecondLayerCase[] {
  if (!rows || rows.length === 0) return []
  return rows.map((c) => ({
    input: safeParseJson(c.inputJson ?? null),
    expected: safeParseJson(c.expectedJson ?? null),
    valueWei: c.valueWei && c.valueWei.trim() ? c.valueWei.trim() : null,
    postCheck: parsePostCheck(c.postCheckJson),
  }))
}

/**
 * Stable hash of the test set + signature, used as part of the verdict cache key.
 * Bumps when admins edit a case so stale verdicts don't get reused.
 */
export function executableCasesHash(
  rows: ExecutableCaseRow[] | undefined | null,
  signature: string | null | undefined,
): string {
  if (!rows || rows.length === 0) return 'none'
  const payload = JSON.stringify({
    sig: signature ?? '',
    cases: rows.map((c) => [c.inputJson ?? '', c.expectedJson ?? '', c.valueWei ?? '', c.postCheckJson ?? '']),
  })
  return createHash('sha256').update(payload).digest('hex').slice(0, 16)
}
