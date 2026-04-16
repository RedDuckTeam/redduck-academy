import { useState, useEffect, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import { DescriptionPanel } from './description-panel'
import { PanelHeader } from './panel-header'
import { CodePanel } from './code-panel'
import type { CodingTaskSubmission, Lesson } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { FileIcon } from '@/components/ui/icons/file'
import { CodeIcon } from '@/components/ui/icons/code'
import { useSubmitCodingTask } from '@/hooks/api/lessons/useSubmitCodingTask'
import { useLessonForUser } from '@/hooks/api/lessons/useLessonForUser'
import { useSession } from '@/hooks/useSession'
import { RateLimitError } from '@/lib/api/coding-task'

interface LessonCodeChallengeProps {
  lesson: Lesson
  courseSlug: string
  lessonSlug: string
  moduleSlug: string
}

export function LessonCodeChallenge({ lesson, courseSlug, lessonSlug }: LessonCodeChallengeProps) {
  const router = useRouter()
  const { session } = useSession()
  const { data: userLesson } = useLessonForUser(courseSlug, lessonSlug)

  const starterCode = lesson.starterCode ?? ''
  const [code, setCode] = useState(starterCode)
  const restoredRef = useRef(false)

  useEffect(() => {
    if (restoredRef.current || !userLesson) return
    const submissions = (userLesson.submissions as CodingTaskSubmission[]) ?? []
    const lastCode = submissions.at(-1)?.submittedCode
    if (lastCode) {
      setCode(lastCode)
    }
    restoredRef.current = true
  }, [userLesson])

  const language = lesson.codingLanguage
  const { mutate: submit, isPending, error: submitError } = useSubmitCodingTask(courseSlug, lessonSlug)

  if (!language) {
    return <div>No language found</div>
  }

  const rateLimitError = submitError instanceof RateLimitError ? submitError : null
  const canSubmit = code.trim().length > 0 && !isPending && !rateLimitError

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-6 xl:flex-row xl:items-stretch">
      <div className="flex flex-col w-full">
        <PanelHeader>
          <FileIcon className="w-5 h-5" />
          <Text variant="caps-14">DESCRIPTION</Text>
        </PanelHeader>
        <div className="flex flex-col flex-1 p-5 border-b border-x border-border overflow-y-auto">
          <DescriptionPanel lesson={lesson} userLesson={userLesson ?? null} />
        </div>
      </div>
      <div className="gap-2.5 flex flex-col w-full">
        <div className="flex flex-col flex-1 w-full">
          <PanelHeader>
            <CodeIcon className="w-5 h-5" />
            <Text variant="caps-14">CODE</Text>
          </PanelHeader>
          <div className="flex flex-col flex-1 border-b border-x border-border overflow-hidden">
            <CodePanel
              lesson={lesson}
              userLesson={userLesson ?? null}
              code={code}
              onCodeChange={setCode}
              onReset={() => setCode(starterCode)}
              onSubmit={() => submit({ courseSlug, lessonSlug, code, language })}
              onSignIn={() => router.navigate({ to: '/sign-up' })}
              isAuthenticated={!!session}
              isPending={isPending}
              canSubmit={canSubmit}
              rateLimitError={rateLimitError}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
