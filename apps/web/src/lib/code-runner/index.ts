import type {
  RunnerOptions,
  RunnerReport,
  RunnerSpec,
  RunnerTestCase,
  SolidityTestCase,
  TsTestCase,
} from './types'

export type {
  RunnerLanguage,
  RunnerOptions,
  RunnerReport,
  RunnerResult,
  RunnerSpec,
  RunnerTestCase,
  SoliditySpec,
  TsRunnerSpec,
  TsTestCase,
  SolidityTestCase,
  SolReturnCase,
  SolPostCheckCase,
} from './types'

const DEFAULT_TS_PER_TEST_MS = 2000
const DEFAULT_SOL_PER_TEST_MS = 5000
const DEFAULT_TOTAL_MS = 30_000

export async function runTests(
  code: string,
  spec: RunnerSpec,
  testCases: RunnerTestCase[],
  opts: RunnerOptions = {},
): Promise<RunnerReport> {
  if (testCases.length === 0) {
    return { allPassed: true, results: [] }
  }

  if (spec.language === 'typescript') {
    const { runTypeScript } = await import('./typescript/runner')
    return runTypeScript(code, spec, testCases as TsTestCase[], {
      perTestTimeoutMs: opts.perTestTimeoutMs ?? DEFAULT_TS_PER_TEST_MS,
      totalTimeoutMs: opts.totalTimeoutMs ?? DEFAULT_TOTAL_MS,
    })
  }

  if (spec.language === 'solidity') {
    const { runSolidity } = await import('./solidity/runner')
    return runSolidity(code, spec, testCases as SolidityTestCase[], {
      perTestTimeoutMs: opts.perTestTimeoutMs ?? DEFAULT_SOL_PER_TEST_MS,
      totalTimeoutMs: opts.totalTimeoutMs ?? DEFAULT_TOTAL_MS,
    })
  }

  return {
    allPassed: false,
    results: [],
    fatalError: `Unsupported language: ${(spec as { language?: string }).language ?? 'unknown'}`,
  }
}
