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
  target?: string | null
  functionName?: string | null
  args?: SolArgRow[] | null
  valueWei?: string | null
  caller?: string | null
  expected?: string | null
}

export interface SolidityCaseRow {
  steps?: SolStepRow[] | null
}

export interface SolidityFixtureRow {
  alias?: string | null
  source?: string | null
  contractName?: string | null
  constructorArgs?: SolArgRow[] | null
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
 * Solidity path: Solidity test cases are NOT sent to the second-layer AI grader —
 * multi-step cases don't add useful cheat-detection signal and pollute the prompt
 * with stateful context the grader can't reason about. We return an empty array so
 * the second-layer prompt sees TS cases only.
 */
export function deserializeSolidityCases(_rows: SolidityCaseRow[] | undefined | null): SecondLayerCase[] {
  return []
}
