export type RunnerLanguage = 'typescript' | 'solidity'

/** TS test case — args + expected are already JSON-parsed (TS has no ABI to coerce). */
export interface TsTestCase {
  id: string
  input: unknown
  expected: unknown
}

/** One step inside a Solidity test case. Steps within a case share EVM state. */
export interface SolCaseStep {
  /** Which deployed contract this step targets. `@-prefixed` alias; defaults to '@self'. */
  target?: string
  functionName: string
  rawArgs: string[]
  valueWei?: string
  /** Optional msg.sender. `@-prefixed` alias or 0x-prefixed address. Defaults to '@default'. */
  caller?: string
  /** Optional raw expected return; when present the runner decodes this step's return and compares. */
  rawExpected?: string
}

/**
 * Lesson-level peer contract that gets deployed (in declaration order) before the
 * student's contract. Tests reference its deployed address via `@<alias>`.
 */
export interface SolFixture {
  alias: string
  source: string
  contractName?: string
  rawConstructorArgs: string[]
}

/** Solidity test case — an ordered list of steps, each of which may carry its own assertion. */
export interface SolCase {
  id: string
  kind: 'case'
  steps: SolCaseStep[]
}

export type SolidityTestCase = SolCase
export type RunnerTestCase = TsTestCase | SolidityTestCase

export interface RunnerResult {
  id: string
  passed: boolean
  input?: unknown
  expected?: unknown
  got?: unknown
  error?: string
  /** Solidity only: 0-based index of the step that failed, when failure is step-attributable. */
  failedStepIndex?: number
  durationMs: number
}

export interface RunnerReport {
  allPassed: boolean
  results: RunnerResult[]
  /** Set when the entire run failed before tests could execute (e.g. compile error). */
  fatalError?: string
}

export interface TsRunnerSpec {
  language: 'typescript'
  /** Name of the function the user is expected to define at module top-level. */
  functionName: string
}

export interface SoliditySpec {
  language: 'solidity'
  /** Optional contract name; defaults to first contract in source. */
  contractName?: string
  /** Constructor arg raw strings (one per parameter). Worker coerces via ABI. May contain `@alias` refs. */
  rawConstructorArgs?: string[]
  /** Peer contracts deployed before the student's contract; tests reference them via `@<alias>`. */
  fixtures?: SolFixture[]
}

export type RunnerSpec = TsRunnerSpec | SoliditySpec

export interface RunnerOptions {
  /** Per-test timeout in ms. */
  perTestTimeoutMs?: number
  /** Hard cap on total run time in ms. */
  totalTimeoutMs?: number
}
