import type { RunnerResult, SolidityTestCase } from '@/lib/code-runner'
import { CallBox } from './call-box'

interface SolidityCallListProps {
  testCase: SolidityTestCase
  result: RunnerResult | undefined
}

/**
 * Renders one CallBox per step in a Solidity test case. The step's `expected`
 * (when set) renders inline under the call. When the runner reports a failure
 * attributable to a specific step, that step's CallBox shows the `got` value
 * and any revert reason in red.
 */
export function SolidityCallList({ testCase, result }: SolidityCallListProps) {
  const failedIndex = result?.failedStepIndex

  return (
    <div className="flex flex-col gap-2">
      {testCase.steps.map((step, i) => {
        const isFailedStep = failedIndex === i
        return (
          <CallBox
            key={`step-${i}`}
            functionName={step.functionName}
            args={step.rawArgs}
            valueWei={step.valueWei}
            caller={step.caller}
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
