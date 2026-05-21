import type { Abi, AbiFunction } from 'viem'
import { compileMulti } from '@redduck/solc-utils'
import {
  runTestCase,
  type RunCaseStep,
  type RunFixture,
} from './run-test-case'

const MAX_CASE_STEPS = 16

const STUDENT_FILENAME = 'user.sol'
const FIXTURE_FILE_PREFIX = 'fixture/'

export interface SolWorkerStep {
  target?: string
  functionName: string
  rawArgs: string[]
  valueWei?: string
  caller?: string
  rawExpected?: string
  rawExpectedRevert?: string
}

export interface SolWorkerCase {
  id: string
  kind: 'case'
  steps: SolWorkerStep[]
}

export interface SolWorkerFixture {
  alias: string
  source: string
  contractName?: string
  rawConstructorArgs: string[]
}

export interface SolRunRequest {
  type: 'compile-and-run'
  source: string
  contractName?: string
  rawConstructorArgs?: string[]
  fixtures: SolWorkerFixture[]
  cases: SolWorkerCase[]
}

export interface SolRunResponse {
  type: 'result'
  fatalError?: string
  results: Array<{
    id: string
    passed: boolean
    failedStepIndex?: number
    got?: unknown
    expected?: unknown
    error?: string
  }>
}

self.onmessage = async (event: MessageEvent<SolRunRequest>) => {
  const msg = event.data
  if (msg?.type !== 'compile-and-run') return
  const respond = (resp: SolRunResponse) => (self as unknown as Worker).postMessage(resp)

  // Compile student source + every fixture source in one solc invocation. Shared
  // import callback + STDLIB across all files, so any source can `import "@openzeppelin/..."`.
  let studentArtifact: { abi: Abi; bytecode: `0x${string}` }
  const fixtureArtifacts = new Map<string, { abi: Abi; bytecode: `0x${string}` }>()
  try {
    const files = [
      { path: STUDENT_FILENAME, content: msg.source, preferredContract: msg.contractName },
      ...msg.fixtures.map((f) => ({
        path: `${FIXTURE_FILE_PREFIX}${f.alias}.sol`,
        content: f.source,
        preferredContract: f.contractName,
      })),
    ]
    const result = await compileMulti(files)
    const student = result.contracts[STUDENT_FILENAME]
    if (!student) throw new Error('student source produced no contract')
    studentArtifact = student
    for (const f of msg.fixtures) {
      const art = result.contracts[`${FIXTURE_FILE_PREFIX}${f.alias}.sol`]
      if (!art) throw new Error(`fixture '${f.alias}' produced no contract`)
      fixtureArtifacts.set(f.alias.toLowerCase(), art)
    }
  } catch (err) {
    respond({ type: 'result', results: [], fatalError: errorMessage(err) })
    return
  }

  // Per-step ABI routing depends on each step's `target`. Build helpers.
  const studentCtorInputs = ctorInputsOf(studentArtifact.abi)
  const fixtures: RunFixture[] = msg.fixtures.map((f) => {
    const art = fixtureArtifacts.get(f.alias.toLowerCase())!
    return {
      alias: f.alias.toLowerCase(),
      abi: art.abi,
      bytecode: art.bytecode,
      rawConstructorArgs: f.rawConstructorArgs,
      ctorInputs: ctorInputsOf(art.abi),
    }
  })

  const results: SolRunResponse['results'] = []
  for (const tc of msg.cases) {
    try {
      if (tc.steps.length === 0) throw new Error('test case has no steps')
      if (tc.steps.length > MAX_CASE_STEPS) {
        throw new Error(`test case exceeds ${MAX_CASE_STEPS}-step cap`)
      }
      const resolvedSteps: RunCaseStep[] = tc.steps.map((step, i) => {
        const targetAbi = resolveTargetAbi(step.target, studentArtifact.abi, fixtureArtifacts)
        if (!targetAbi) {
          throw new Error(
            `step ${i + 1}: unknown target '${step.target}'. ` +
              `Use @self for the student contract or a fixture alias (e.g. @mockToken).`,
          )
        }
        const fnAbi = requireFunction(targetAbi, step.functionName)
        if (step.rawArgs.length !== (fnAbi.inputs ?? []).length) {
          throw new Error(
            `step ${i + 1} (${fnAbi.name}): expected ${(fnAbi.inputs ?? []).length} arg(s), got ${step.rawArgs.length}`,
          )
        }
        const hasExpected =
          step.rawExpected !== undefined && step.rawExpected !== null && step.rawExpected !== ''
        const expectsRevert =
          step.rawExpectedRevert !== undefined &&
          step.rawExpectedRevert !== null &&
          step.rawExpectedRevert !== ''
        if (hasExpected && expectsRevert) {
          throw new Error(
            `step ${i + 1} (${fnAbi.name}): cannot set both 'expected' and 'expectedRevert' on the same step`,
          )
        }
        return {
          fnAbi,
          argInputs: (fnAbi.inputs ?? []) as readonly { type: string }[],
          rawArgs: step.rawArgs,
          valueWei: step.valueWei,
          rawCaller: step.caller,
          target: step.target,
          rawExpected: step.rawExpected,
          hasExpected,
          rawExpectedRevert: step.rawExpectedRevert,
          expectsRevert,
        }
      })

      const outcome = await runTestCase({
        kind: 'case',
        studentBytecode: studentArtifact.bytecode,
        studentAbi: studentArtifact.abi,
        studentRawConstructorArgs: msg.rawConstructorArgs ?? [],
        studentCtorInputs,
        fixtures,
        steps: resolvedSteps,
      })
      results.push({
        id: tc.id,
        passed: outcome.passed,
        failedStepIndex: outcome.failedStepIndex,
        got: outcome.got,
        expected: outcome.expected,
        error: outcome.error,
      })
    } catch (err) {
      results.push({ id: tc.id, passed: false, error: errorMessage(err) })
    }
  }
  respond({ type: 'result', results })
}

function ctorInputsOf(abi: Abi): readonly { type: string }[] {
  const ctor = abi.find(
    (item): item is Extract<Abi[number], { type: 'constructor' }> => item.type === 'constructor',
  )
  return (ctor?.inputs ?? []) as readonly { type: string }[]
}

function resolveTargetAbi(
  target: string | undefined,
  studentAbi: Abi,
  fixtureArtifacts: Map<string, { abi: Abi; bytecode: `0x${string}` }>,
): Abi | null {
  const trimmed = target?.trim() ?? ''
  if (trimmed === '' || trimmed === '@self') return studentAbi
  if (!trimmed.startsWith('@')) return null
  const key = trimmed.slice(1).toLowerCase()
  if (key === 'self') return studentAbi
  const hit = fixtureArtifacts.get(key)
  return hit ? hit.abi : null
}

function requireFunction(abi: Abi, name: string): AbiFunction {
  const fn = abi.find((item): item is AbiFunction => item.type === 'function' && item.name === name)
  if (!fn) throw new Error(`function "${name}" not found in compiled ABI`)
  return fn
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
