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

interface SolStepRow {
  functionName?: string | null
  args?: SolArgRow[] | null
  valueWei?: string | null
  caller?: string | null
}

export interface SolidityCaseRow {
  blockType: 'returnAssertion' | 'postCheckAssertion' | 'sequence'
  functionName?: string | null
  args?: SolArgRow[] | null
  valueWei?: string | null
  caller?: string | null
  expected?: string | null
  // postCheckAssertion-only
  postCheckFunctionName?: string | null
  postCheckArgs?: SolArgRow[] | null
  postCheckCaller?: string | null
  // sequence-only
  steps?: SolStepRow[] | null
  assertion?: 'lastReturn' | 'postCheck' | null
}

/** TS path: convert Payload's `executableTestCases` rows into prompt-ready cases. */
export function deserializeExecutableCases(rows: TsExecutableCaseRow[] | undefined | null): SecondLayerCase[] {
  if (!rows || rows.length === 0) return []
  return rows.map((c) => ({
    input: safeParseJson(c.inputJson ?? null),
    expected: safeParseJson(c.expectedJson ?? null),
  }))
}

/**
 * Solidity path: convert Payload's `solidityTestCases` blocks into prompt-ready cases.
 *
 * `sequence` cases are intentionally omitted from the second-layer AI grader prompt:
 * the chain's intermediate state doesn't help the cheat-detection signal, and the
 * structured XML would add noise without improving the verdict. They still participate
 * in the case-set hash (see `executableCasesHash`) so admin edits bust stale verdicts.
 */
export function deserializeSolidityCases(rows: SolidityCaseRow[] | undefined | null): SecondLayerCase[] {
  if (!rows || rows.length === 0) return []
  return rows.flatMap((c): SecondLayerCase[] => {
    if (c.blockType === 'sequence') return []
    const rawArgs = (c.args ?? []).map((a) => a?.value ?? '')
    if (c.blockType === 'returnAssertion') {
      return [{
        kind: 'returnAssertion',
        functionName: c.functionName ?? '',
        rawArgs,
        valueWei: c.valueWei ?? null,
        caller: c.caller ?? null,
        rawExpected: c.expected ?? '',
      }]
    }
    return [{
      kind: 'postCheckAssertion',
      functionName: c.functionName ?? '',
      rawArgs,
      valueWei: c.valueWei ?? null,
      caller: c.caller ?? null,
      postCheckFunctionName: c.postCheckFunctionName ?? '',
      rawPostCheckArgs: (c.postCheckArgs ?? []).map((a) => a?.value ?? ''),
      postCheckCaller: c.postCheckCaller ?? null,
      rawExpected: c.expected ?? '',
    }]
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
      c.caller ?? '',
      c.expected ?? '',
      c.postCheckFunctionName ?? '',
      (c.postCheckArgs ?? []).map((a) => a?.value ?? ''),
      c.postCheckCaller ?? '',
      // sequence-only — empty/[] for the other two block types
      c.assertion ?? '',
      (c.steps ?? []).map((s) => [
        s?.functionName ?? '',
        (s?.args ?? []).map((a) => a?.value ?? ''),
        s?.valueWei ?? '',
        s?.caller ?? '',
      ]),
    ]),
  })
  return createHash('sha256').update(payload).digest('hex').slice(0, 16)
}
