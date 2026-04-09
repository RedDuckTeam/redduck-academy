import { useState } from 'react'
import { DescriptionPanel } from './description-panel'
import { PanelHeader } from './panel-header'
import { CodePanel } from './code-panel'
import type { CodingTaskSubmission, Lesson } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { FileIcon } from '@/components/ui/icons/file'
import { CodeIcon } from '@/components/ui/icons/code'
import { useSubmitCodingTask } from '@/hooks/api/lessons/useSubmitCodingTask'
import { useLessonForUser } from '@/hooks/api/lessons/useLessonForUser'

interface LessonCodeChallengeProps {
  lesson: Lesson
  courseSlug: string
  lessonSlug: string
  moduleSlug: string
}

export function LessonCodeChallenge({ lesson, courseSlug, lessonSlug }: LessonCodeChallengeProps) {
  const { data: userLesson } = useLessonForUser(courseSlug, lessonSlug)

  const starterCode = lesson.starterCode ?? ''
  const submissions = (userLesson?.submissions as CodingTaskSubmission[]) ?? []
  const latestCode = submissions?.at(-1)?.submittedCode ?? starterCode
  const [code, setCode] = useState(latestCode)

  const language = lesson.codingLanguage
  const { mutate: submit, isPending } = useSubmitCodingTask(courseSlug, lessonSlug)

  if (!language) {
    return <div>No language found</div>
  }
  const attemptsLeft = userLesson?.attemptsLeft ?? 50
  const canSubmit = code.trim().length > 0 && !isPending && attemptsLeft > 0

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
              isPending={isPending}
              canSubmit={canSubmit}
              attemptsLeft={attemptsLeft}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
