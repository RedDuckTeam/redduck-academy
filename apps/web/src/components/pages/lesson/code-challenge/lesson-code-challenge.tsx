import { useEffect, useRef, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
import { DescriptionPanel } from './description-panel'
import { PanelHeader } from './panel-header'
import { CodePanel } from './code-panel'
import type { CodingTaskSubmission, Lesson } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { FileIcon } from '@/components/ui/icons/file'
import { CodeIcon } from '@/components/ui/icons/code'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useSubmitCodingTask } from '@/hooks/api/lessons/useSubmitCodingTask'
import { useLessonForUser } from '@/hooks/api/lessons/useLessonForUser'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { useSession } from '@/hooks/useSession'
import { useCodeRunner } from '@/hooks/lessons/useCodeRunner'
import { RateLimitError } from '@/lib/api/rate-limit'
import { parseLessonTestCases } from '@/lib/lessons/parse-executable-cases'

interface LessonCodeChallengeProps {
  lesson: Lesson
  courseSlug: string
  lessonSlug: string
  moduleSlug: string
}

export function LessonCodeChallenge({ lesson, courseSlug, lessonSlug }: LessonCodeChallengeProps) {
  const router = useRouter()
  const { session } = useSession()
  const posthog = usePostHog()
  const { data: userLesson } = useLessonForUser(courseSlug, lessonSlug)

  const starterCode = lesson.starterCode ?? ''
  const storageKey = `redduck:coding-task:${courseSlug}:${lessonSlug}`
  const { value: code, setValue: setCode } = useLocalStorageState<string>(storageKey, starterCode)
  const restoredRef = useRef(false)

  useEffect(() => {
    if (restoredRef.current || !userLesson) return
    // localStorage takes precedence over the last submitted code so that in-progress
    // edits survive across reloads and sign-in redirects.
    const hasSavedDraft = (() => {
      try {
        return window.localStorage.getItem(storageKey) !== null
      } catch {
        return false
      }
    })()
    if (!hasSavedDraft) {
      const submissions = (userLesson.submissions as CodingTaskSubmission[]) ?? []
      const lastCode = submissions.at(-1)?.submittedCode
      if (lastCode) setCode(lastCode)
    }
    restoredRef.current = true
  }, [userLesson, storageKey, setCode])

  const { report, isRunning, liveStatus, run, applyServerVerdict } = useCodeRunner(lesson)
  const { mutate: submit, isPending, error: submitError } = useSubmitCodingTask(courseSlug, lessonSlug)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  const language = lesson.codingLanguage
  const parsedCases = useMemo(() => parseLessonTestCases(lesson), [lesson])
  const hasExecutableTests = parsedCases.length > 0

  if (!language) return <div>No language found</div>

  const rateLimitError = submitError instanceof RateLimitError ? submitError : null
  const isHardBlocked = rateLimitError?.reason === 'daily' || rateLimitError?.reason === 'monthly'
  const canSubmit = code.trim().length > 0 && !isPending && !isRunning && !isHardBlocked

  const handleSubmit = () => {
    posthog.capture('coding_task_submitted', {
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      lesson_title: lesson.title,
      language,
    })
    submit(
      { courseSlug, lessonSlug, code, language, lesson },
      { onSuccess: (result) => applyServerVerdict({ passed: result.passed, report: result.report }) },
    )
  }

  const handleRun = hasExecutableTests
    ? () => {
        if (isRunning || isPending) return
        void run(code)
      }
    : undefined

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 xl:flex-row xl:items-stretch xl:h-full xl:min-h-0">
      <div className="flex flex-col w-full xl:h-full xl:min-h-0 xl:overflow-hidden">
        <PanelHeader>
          <FileIcon className="w-5 h-5" />
          <Text variant="caps-14">DESCRIPTION</Text>
        </PanelHeader>
        <div className="flex flex-col flex-1 p-5 border-b border-x border-border overflow-y-auto">
          <DescriptionPanel lesson={lesson} userLesson={userLesson ?? null} />
        </div>
      </div>
      <div className="gap-2.5 flex flex-col w-full xl:h-full xl:min-h-0 xl:overflow-hidden">
        <div className="flex flex-col flex-1 w-full xl:h-full xl:min-h-0">
          <PanelHeader>
            <CodeIcon className="w-5 h-5" />
            <Text variant="caps-14">CODE</Text>
          </PanelHeader>
          <div className="flex flex-col flex-1 border-b border-x border-border overflow-hidden xl:min-h-0">
            <CodePanel
              lesson={lesson}
              userLesson={userLesson ?? null}
              code={code}
              onCodeChange={setCode}
              onReset={() => setIsResetDialogOpen(true)}
              onSubmit={handleSubmit}
              onRun={handleRun}
              onSignIn={() => router.navigate({ to: '/sign-up' })}
              isAuthenticated={!!session}
              isPending={isPending}
              isRunning={isRunning}
              canSubmit={canSubmit}
              rateLimitError={rateLimitError}
              report={report}
              liveStatus={liveStatus}
            />
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
        onConfirm={() => {
          setCode(starterCode)
          setIsResetDialogOpen(false)
        }}
        title="Reset code?"
        description="Your current code will be replaced with the starter code. This cannot be undone."
        confirmLabel="Reset"
      />
    </div>
  )
}
