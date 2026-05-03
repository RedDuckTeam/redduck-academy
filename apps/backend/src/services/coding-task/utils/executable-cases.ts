import { createHash } from 'crypto'
import type { SecondLayerCase } from '../prompt.builder'
import { safeParseJson } from './safe-parse-json'

export interface TsExecutableCaseRow {
  inputJson?: string | null
  expectedJson?: string | null
}

interface SolArgRow {
  value?: string | null
}

export interface SolidityCaseRow {
  blockType: 'returnAssertion' | 'postCheckAssertion'
  functionName?: string | null
  args?: SolArgRow[] | null
  valueWei?: string | null
  expected?: string | null
  // postCheckAssertion-only
  postCheckFunctionName?: string | null
  postCheckArgs?: SolArgRow[] | null
}

/** TS path: convert Payload's `executableTestCases` rows into prompt-ready cases. */
export function deserializeExecutableCases(rows: TsExecutableCaseRow[] | undefined | null): SecondLayerCase[] {
  if (!rows || rows.length === 0) return []
  return rows.map((c) => ({
    input: safeParseJson(c.inputJson ?? null),
    expected: safeParseJson(c.expectedJson ?? null),
  }))
}

/** Solidity path: convert Payload's `solidityTestCases` blocks into prompt-ready cases. */
export function deserializeSolidityCases(rows: SolidityCaseRow[] | undefined | null): SecondLayerCase[] {
  if (!rows || rows.length === 0) return []
  return rows.map((c) => {
    const rawArgs = (c.args ?? []).map((a) => a?.value ?? '')
    if (c.blockType === 'returnAssertion') {
      return {
        kind: 'returnAssertion' as const,
        functionName: c.functionName ?? '',
        rawArgs,
        valueWei: c.valueWei ?? null,
        rawExpected: c.expected ?? '',
      }
    }
    return {
      kind: 'postCheckAssertion' as const,
      functionName: c.functionName ?? '',
      rawArgs,
      valueWei: c.valueWei ?? null,
      postCheckFunctionName: c.postCheckFunctionName ?? '',
      rawPostCheckArgs: (c.postCheckArgs ?? []).map((a) => a?.value ?? ''),
      rawExpected: c.expected ?? '',
    }
  })
}

/**
 * Stable hash of the test set, used as part of the verdict cache key. Bumps when
 * admins edit a case so stale verdicts don't get reused. Handles both shapes.
 */
export function executableCasesHash(
  tsRows: TsExecutableCaseRow[] | undefined | null,
  solRows: SolidityCaseRow[] | undefined | null,
  signature: string | null | undefined,
  constructorArgs: string[] | null | undefined,
): string {
  if ((!tsRows || tsRows.length === 0) && (!solRows || solRows.length === 0)) return 'none'
  const payload = JSON.stringify({
    sig: signature ?? '',
    ctor: constructorArgs ?? [],
    ts: (tsRows ?? []).map((c) => [c.inputJson ?? '', c.expectedJson ?? '']),
    sol: (solRows ?? []).map((c) => [
      c.blockType,
      c.functionName ?? '',
      (c.args ?? []).map((a) => a?.value ?? ''),
      c.valueWei ?? '',
      c.expected ?? '',
      c.postCheckFunctionName ?? '',
      (c.postCheckArgs ?? []).map((a) => a?.value ?? ''),
    ]),
  })
  return createHash('sha256').update(payload).digest('hex').slice(0, 16)
}
