import { useEffect } from 'react'
import type { RunnerResult, RunnerTestCase } from '@/lib/code-runner'
import { getDisplayArgs, getDisplayExpected } from '../utils'
import { Section } from './section'
import { SolidityCallList } from './solidity-call-list'
import { ValueBox } from './value-box'

interface CaseDetailProps {
  testCase: RunnerTestCase
  argNames: string[]
  result: RunnerResult | undefined
  /** Display label for `@self` references (typically the student's contract name). */
  selfLabel?: string
}

export function CaseDetail({ testCase, argNames, result, selfLabel }: CaseDetailProps) {
  const isSolidity = 'kind' in testCase

  useEffect(() => {
    if (!result) return
    if (result.error || !result.passed) {
      // eslint-disable-next-line no-console
      console.log('[runner result]', {
        caseId: result.id,
        passed: result.passed,
        failedStepIndex: result.failedStepIndex,
        expected: result.expected,
        got: result.got,
        error: result.error,
        testCase,
      })
    }
  }, [result, testCase])

  if (isSolidity) {
    // Solidity cases render assertions inline per step (expected / got / revert),
    // so we don't show top-level Output / Got sections. Case-level errors that
    // can't be attributed to a step still surface as a fallback Error section.
    const hasCaseLevelError = !!result?.error && result.failedStepIndex === undefined
    return (
      <div className="flex flex-col gap-3">
        <Section label="Call">
          <SolidityCallList testCase={testCase} result={result} selfLabel={selfLabel} />
        </Section>
        {hasCaseLevelError && (
          <Section label="Error">
            <pre className="whitespace-pre-wrap text-primary text-[12px] leading-[16px] bg-primary/10 px-3 py-2">
              {result.error}
            </pre>
          </Section>
        )}
      </div>
    )
  }

  const expected = getDisplayExpected(testCase)
  return (
    <div className="flex flex-col gap-3">
      <Section label="Input">
        <div className="flex flex-col gap-2">
          {getDisplayArgs(testCase).map((value, i) => (
            <ValueBox key={i} name={argNames[i] ?? `arg${i + 1}`} value={value} />
          ))}
        </div>
      </Section>

      <Section label="Output">
        <ValueBox value={expected} />
      </Section>

      {result?.error && (
        <Section label="Error">
          <pre className="whitespace-pre-wrap text-primary text-[12px] leading-[16px] bg-primary/10 px-3 py-2">
            {result.error}
          </pre>
        </Section>
      )}

      {result && !result.error && (
        <Section label="Got">
          <ValueBox value={result.got} highlight={result.passed ? 'pass' : 'fail'} />
        </Section>
      )}
    </div>
  )
}
