import type { ReactNode } from 'react'
import type { RunnerResult, RunnerTestCase, SolidityTestCase } from '@/lib/code-runner'
import { getDisplayArgs, getDisplayExpected } from './utils'
import { Section } from './case-detail/section'
import { ValueBox } from './case-detail/value-box'
import { CallBox } from './case-detail/call-box'

interface CaseDetailProps {
  testCase: RunnerTestCase
  argNames: string[]
  result: RunnerResult | undefined
}

export function CaseDetail({ testCase, argNames, result }: CaseDetailProps) {
  const expected = getDisplayExpected(testCase)
  const isSolidity = 'kind' in testCase

  return (
    <div className="flex flex-col gap-3">
      {isSolidity ? (
        <Section label="Call">
          <div className="flex flex-col gap-2">{renderSolidityCalls(testCase)}</div>
        </Section>
      ) : (
        <Section label="Input">
          <div className="flex flex-col gap-2">
            {getDisplayArgs(testCase).map((value, i) => (
              <ValueBox key={i} name={argNames[i] ?? `arg${i + 1}`} value={value} />
            ))}
          </div>
        </Section>
      )}

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

function renderSolidityCalls(tc: SolidityTestCase): ReactNode[] {
  return tc.steps.map((s, i) => (
    <CallBox key={`step-${i}`} functionName={s.functionName} args={s.rawArgs} valueWei={s.valueWei} caller={s.caller} />
  ))
}
