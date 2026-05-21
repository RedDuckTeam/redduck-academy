import type { RunnerResult, SolidityTestCase } from '@/lib/code-runner'
import { CallBox } from './call-box'

interface SolidityCallListProps {
  testCase: SolidityTestCase
  result: RunnerResult | undefined
  /** Label substituted for `@self` in step args/callers (typically the contract name). */
  selfLabel?: string
}

/**
 * Renders one CallBox per step in a Solidity test case. The step's `expected`
 * (when set) renders inline under the call. When the runner reports a failure
 * attributable to a specific step, that step's CallBox shows the `got` value
 * and any revert reason in red.
 */
export function SolidityCallList({ testCase, result, selfLabel }: SolidityCallListProps) {
  const failedIndex = result?.failedStepIndex
  const visibleSteps = testCase.steps
    .map((step, i) => ({ step, originalIndex: i }))
    .filter(({ step }) => !step.hideFromLearner)

  return (
    <div className="flex flex-col gap-2">
      {visibleSteps.map(({ step, originalIndex }) => {
        const isFailedStep = failedIndex === originalIndex
        return (
          <CallBox
            key={`step-${originalIndex}`}
            functionName={step.functionName}
            args={step.rawArgs}
            valueWei={step.valueWei}
            caller={step.caller}
            target={step.target}
            selfLabel={selfLabel}
            expected={step.rawExpected}
            got={isFailedStep ? result?.got : undefined}
            failed={isFailedStep}
            errorMessage={isFailedStep ? result?.error : undefined}
          />
        )
      })}
    </div>
  )
}
