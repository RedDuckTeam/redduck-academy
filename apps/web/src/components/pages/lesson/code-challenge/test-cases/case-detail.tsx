import type { RunnerResult, RunnerTestCase } from '@/lib/code-runner'
import { Section } from './section'
import { ValueBox } from './value-box'
import { getDisplayArgs, getDisplayExpected } from './utils'

interface CaseDetailProps {
  testCase: RunnerTestCase
  argNames: string[]
  result: RunnerResult | undefined
}

export function CaseDetail({ testCase, argNames, result }: CaseDetailProps) {
  const inputs = getDisplayArgs(testCase)
  const expected = getDisplayExpected(testCase)
  const isSolidity = 'kind' in testCase
  const fnLabel = isSolidity ? testCase.functionName : null
  const modeLabel =
    isSolidity && testCase.kind === 'postCheckAssertion'
      ? `post-check ${testCase.postCheckFunctionName}()`
      : null

  return (
    <div className="flex flex-col gap-3">
      {(fnLabel || modeLabel) && (
        <Section label="Call">
          <div className="text-[13px] text-muted-foreground">
            {fnLabel}
            {modeLabel ? <span className="ml-2 opacity-70">→ {modeLabel}</span> : null}
          </div>
        </Section>
      )}

      <Section label="Input">
        <div className="flex flex-col gap-2">
          {inputs.map((value, i) => (
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
