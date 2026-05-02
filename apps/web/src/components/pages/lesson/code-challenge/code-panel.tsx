import { useMemo, useRef } from 'react'
import { CodeEditor, type CodeEditorHandle } from './code-editor'
import { TestCaseTabs } from './test-cases'
import { CodePanelToolbar } from './header/code-panel-toolbar'
import { CodePanelStatusBar } from './status-bar/code-panel-status-bar'
import { useStatusBarState } from './status-bar/use-status-bar-state'
import type { CodingTaskSubmission, Lesson, LessonForUser } from '@/types/lesson'
import type { RateLimitError } from '@/lib/api/rate-limit'
import type { RunnerReport } from '@/lib/code-runner'
import type { LiveStatus } from '@/hooks/lessons/useCodeRunner'
import { parseExecutableCases } from '@/lib/lessons/parse-executable-cases'

interface CodePanelProps {
  lesson: Lesson
  userLesson: LessonForUser | null
  code: string
  onCodeChange: (value: string) => void
  onReset: () => void
  onSubmit: () => void
  onRun?: () => void
  onSignIn: () => void
  isAuthenticated: boolean
  isPending: boolean
  isRunning?: boolean
  canSubmit: boolean
  rateLimitError: RateLimitError | null
  report?: RunnerReport | null
  liveStatus?: LiveStatus
}

export function CodePanel({
  lesson,
  userLesson,
  code,
  onCodeChange,
  onReset,
  onSubmit,
  onRun,
  onSignIn,
  isAuthenticated,
  isPending,
  isRunning = false,
  canSubmit,
  rateLimitError,
  report,
  liveStatus = null,
}: CodePanelProps) {
  const editorRef = useRef<CodeEditorHandle>(null)

  const submissions = (userLesson?.submissions as CodingTaskSubmission[]) ?? []
  const latest = submissions.at(-1)
  const parsedCases = useMemo(() => parseExecutableCases(lesson.executableTestCases), [lesson.executableTestCases])
  const hasExecutableTests = parsedCases.length > 0

  const statusBarState = useStatusBarState({
    rateLimitError,
    liveStatus,
    latest,
    isPending,
    isRunning,
  })

  return (
    <div className="relative flex flex-col xl:h-full pb-9">
      <CodePanelToolbar
        language={lesson.codingLanguage}
        isAuthenticated={isAuthenticated}
        isPending={isPending}
        isRunning={isRunning}
        canSubmit={canSubmit}
        hasExecutableTests={hasExecutableTests}
        hasCode={code.trim().length > 0}
        onFormat={() => editorRef.current?.format()}
        onReset={onReset}
        onSignIn={onSignIn}
        onSubmit={onSubmit}
        onRun={onRun}
      />
      <div className="min-h-[400px] xl:flex-1 xl:min-h-0 xl:overflow-hidden">
        <CodeEditor ref={editorRef} value={code} onChange={onCodeChange} language={lesson.codingLanguage ?? 'solidity'} />
      </div>
      {hasExecutableTests && (
        <TestCaseTabs
          executableCases={parsedCases}
          functionSignature={lesson.functionSignature}
          report={report ?? null}
          isRunning={isRunning || isPending}
        />
      )}
      <CodePanelStatusBar state={statusBarState} />
    </div>
  )
}
