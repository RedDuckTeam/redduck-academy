import { useMemo } from 'react'
import type { RunnerReport, RunnerResult, RunnerTestCase } from '@/lib/code-runner'

const VISIBLE_LIMIT = 3

export interface UseVisibleCasesArgs {
  cases: RunnerTestCase[]
  report: RunnerReport | null
  resultsById: Map<string, RunnerResult>
}

/**
 * LeetCode-style visibility:
 *   - Always show the first 3 cases.
 *   - If a fresh report shows ALL visible cases passing AND a hidden case failing,
 *     append the first failing hidden case as a 4th tab so the learner sees something
 *     concrete to fix.
 *   - If any visible case is already failing, no hidden tab is added — there's already
 *     a visible failure to look at.
 */
export function useVisibleCases({ cases, report, resultsById }: UseVisibleCasesArgs): RunnerTestCase[] {
  return useMemo(() => {
    const visible = cases.slice(0, VISIBLE_LIMIT)
    if (cases.length <= VISIBLE_LIMIT || !report) return visible
    const allVisiblePassed = visible.every((tc) => resultsById.get(tc.id)?.passed === true)
    if (!allVisiblePassed) return visible
    const firstHiddenFail = cases
      .slice(VISIBLE_LIMIT)
      .find((tc) => resultsById.get(tc.id)?.passed === false)
    return firstHiddenFail ? [...visible, firstHiddenFail] : visible
  }, [cases, report, resultsById])
}
