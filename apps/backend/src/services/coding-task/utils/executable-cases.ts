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
 *
 * The case data still participates in `executableCasesHash` so admin edits bust
 * any cached verdicts.
 */
export function deserializeSolidityCases(_rows: SolidityCaseRow[] | undefined | null): SecondLayerCase[] {
  return []
}

/**
 * Stable hash of the test set, used as part of the verdict cache key. Bumps when
 * admins edit a case (or a fixture) so stale verdicts don't get reused. Mixes
 * TS rows, Solidity cases (steps + target), Solidity fixtures (source + ctor args),
 * function signature, and constructor args.
 */
export function executableCasesHash(
  tsRows: TsExecutableCaseRow[] | undefined | null,
  solRows: SolidityCaseRow[] | undefined | null,
  signature: string | null | undefined,
  constructorArgs: string[] | null | undefined,
  solFixtures?: SolidityFixtureRow[] | null,
): string {
  const hasNothing =
    (!tsRows || tsRows.length === 0) &&
    (!solRows || solRows.length === 0) &&
    (!solFixtures || solFixtures.length === 0)
  if (hasNothing) return 'none'
  const payload = JSON.stringify({
    sig: signature ?? '',
    ctor: constructorArgs ?? [],
    ts: (tsRows ?? []).map((c) => [c.inputJson ?? '', c.expectedJson ?? '']),
    sol: (solRows ?? []).map((c) =>
      (c.steps ?? []).map((s) => [
        s?.target ?? '',
        s?.functionName ?? '',
        (s?.args ?? []).map((a) => a?.value ?? ''),
        s?.valueWei ?? '',
        s?.caller ?? '',
        s?.expected ?? '',
      ]),
    ),
    fix: (solFixtures ?? []).map((f) => [
      f?.alias ?? '',
      f?.source ?? '',
      f?.contractName ?? '',
      (f?.constructorArgs ?? []).map((a) => a?.value ?? ''),
    ]),
  })
  return createHash('sha256').update(payload).digest('hex').slice(0, 16)
}
