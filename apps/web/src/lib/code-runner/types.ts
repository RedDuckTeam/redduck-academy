export type RunnerLanguage = 'typescript' | 'solidity'

export interface PostCheck {
  signature: string
  args: unknown[]
}

export interface RunnerTestCase {
  id: string
  input: unknown
  expected: unknown
  /** Solidity only. Decimal string sent as `msg.value`. */
  valueWei?: string
  /** Solidity only. When set, the runner calls this view after the main call and compares its return. */
  postCheck?: PostCheck
}

export interface RunnerResult {
  id: string
  passed: boolean
  input: unknown
  expected: unknown
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
  /** Full Solidity function signature, e.g. `function add(uint256 a, uint256 b) external view returns (uint256)`. */
  functionSignature: string
  /** Optional JSON-decoded array of constructor arguments. */
  constructorArgs?: unknown[]
}

export type RunnerSpec = TsRunnerSpec | SoliditySpec

export interface RunnerOptions {
  /** Per-test timeout in ms. */
  perTestTimeoutMs?: number
  /** Hard cap on total run time in ms. */
  totalTimeoutMs?: number
}
