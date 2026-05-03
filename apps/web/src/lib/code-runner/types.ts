export type RunnerLanguage = 'typescript' | 'solidity'

/** TS test case — args + expected are already JSON-parsed (TS has no ABI to coerce). */
export interface TsTestCase {
  id: string
  input: unknown
  expected: unknown
}

/** Solidity test case (returns a value). Raw strings; the worker coerces via ABI. */
export interface SolReturnCase {
  id: string
  kind: 'returnAssertion'
  functionName: string
  rawArgs: string[]
  valueWei?: string
  rawExpected: string
}

/** Solidity test case (state-changing main call + view post-check). Raw strings. */
export interface SolPostCheckCase {
  id: string
  kind: 'postCheckAssertion'
  functionName: string
  rawArgs: string[]
  valueWei?: string
  postCheckFunctionName: string
  rawPostCheckArgs: string[]
  rawExpected: string
}

export type SolidityTestCase = SolReturnCase | SolPostCheckCase
export type RunnerTestCase = TsTestCase | SolidityTestCase

export interface RunnerResult {
  id: string
  passed: boolean
  input?: unknown
  expected?: unknown
  got?: unknown
  error?: string
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
  /** Constructor arg raw strings (one per parameter). Worker coerces via ABI. */
  rawConstructorArgs?: string[]
}

export type RunnerSpec = TsRunnerSpec | SoliditySpec

export interface RunnerOptions {
  /** Per-test timeout in ms. */
  perTestTimeoutMs?: number
  /** Hard cap on total run time in ms. */
  totalTimeoutMs?: number
}
