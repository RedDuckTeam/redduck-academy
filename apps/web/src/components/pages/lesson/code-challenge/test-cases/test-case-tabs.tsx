import { useEffect, useMemo, useState } from 'react'
import { Text } from '@/components/ui/text'
import type { RunnerReport, RunnerResult, RunnerTestCase } from '@/lib/code-runner'
import { extractArgNames } from '@/lib/lessons/extract-arg-names'
import { PanelHeader } from '../panel-header'
import { CaseTab } from './case-tab'
// Import from the directory's index explicitly. Earlier, a stale orphan
// `./case-detail.tsx` kept getting recreated at this path and shadowed the
// `./case-detail/` directory — using the explicit index path removes the
// ambiguity so the resolution can't drift back.
import { CaseDetail } from './case-detail/index'
import { useVisibleCases } from './hooks/use-visible-cases'
import { resolveCaseStatus } from './utils'
import { CodingAppTerminalIcon } from '@/components/ui/icons/coding-app-terminal'

interface TestCaseTabsProps {
  /** Already JSON-parsed cases (use `parseExecutableCases(lesson.executableTestCases)`). */
  executableCases: RunnerTestCase[]
  /** Raw signature from Payload — used only to extract argument names for display. */
  functionSignature?: string | null
  /** Display label for `@self` in Solidity call rendering (e.g. the contract name). */
  selfLabel?: string
  report: RunnerReport | null
  isRunning: boolean
}

export function TestCaseTabs({
  executableCases,
  functionSignature,
  selfLabel,
  report,
  isRunning,
}: TestCaseTabsProps) {
  const [selected, setSelected] = useState(0)

  const argCount = useMemo(
    () =>
      executableCases.reduce((acc, tc) => {
        // Solidity cases have per-step args, not a single function signature — their
        // detail view renders step-level labels instead of named args, so skip them
        // for the case-level argument-name count.
        if ('kind' in tc) return acc
        return Math.max(acc, Array.isArray(tc.input) ? tc.input.length : 1)
      }, 0),
    [executableCases],
  )
  const argNames = useMemo(() => extractArgNames(functionSignature, argCount), [functionSignature, argCount])

  const resultsById = useMemo(() => {
    const map = new Map<string, RunnerResult>()
    for (const r of report?.results ?? []) map.set(r.id, r)
    return map
  }, [report])

  const tabsToShow = useVisibleCases({ cases: executableCases, report, resultsById })

  // Jump to the first failing tab on a fresh report.
  useEffect(() => {
    if (!report || isRunning) return
    const firstFail = tabsToShow.findIndex((tc) => resultsById.get(tc.id)?.passed === false)
    if (firstFail >= 0) setSelected(firstFail)
  }, [report, isRunning, tabsToShow, resultsById])

  // Keep `selected` in bounds when the tab set shrinks (e.g. hidden tab disappears on next run).
  useEffect(() => {
    if (selected >= tabsToShow.length) setSelected(0)
  }, [tabsToShow.length, selected])

  if (executableCases.length === 0) return null

  const current = tabsToShow[selected]
  const currentResult = current ? resultsById.get(current.id) : undefined

  return (
    <div className="flex flex-col max-h-[300px] overflow-y-auto">
      <div className="sticky top-0 z-10">
        <PanelHeader>
          <CodingAppTerminalIcon className="w-5 h-5" />
          <Text variant="caps-14">TEST CASES</Text>
          {report?.fatalError && (
            <Text variant="main-14" className="text-primary truncate ml-3">
              {report.fatalError}
            </Text>
          )}
        </PanelHeader>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {tabsToShow.map((tc, index) => (
            <CaseTab
              key={tc.id}
              index={index}
              status={resolveCaseStatus(resultsById.get(tc.id), isRunning)}
              isSelected={selected === index}
              onSelect={() => setSelected(index)}
            />
          ))}
        </div>

        {current && (
          <CaseDetail testCase={current} argNames={argNames} result={currentResult} selfLabel={selfLabel} />
        )}
      </div>
    </div>
  )
}
