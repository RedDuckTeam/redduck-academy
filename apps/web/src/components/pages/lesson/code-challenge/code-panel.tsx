import { CodeEditor } from './code-editor'
import { TestCaseTabs } from './test-case-tabs'
import type { LessonForUser } from '@/types/lesson'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { Loader2 } from 'lucide-react'
import { useSubmitCodingTask } from '@/hooks/api/lessons/useSubmitCodingTask'

interface CodePanelProps {
  lesson: LessonForUser
  courseSlug: string
  lessonSlug: string
  code: string
  onCodeChange: (value: string) => void
}

export function CodePanel({ lesson, courseSlug, lessonSlug, code, onCodeChange }: CodePanelProps) {
  const language = lesson.codingLanguage ?? 'solidity'

  const { mutate: submit, isPending } = useSubmitCodingTask(courseSlug, lessonSlug)

  const attemptsLeft = lesson.attemptsLeft ?? 3
  const canSubmit = code.trim().length > 0 && !isPending && attemptsLeft > 0

  function handleSubmit() {
    submit({ courseSlug, lessonSlug, code, language })
  }

  return (
    <div className="flex flex-col">
      <CodeEditor value={code} onChange={onCodeChange} language={language} />

      <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-[#2d2d2d]">
        <Button size="sm" variant="secondary" onClick={handleSubmit} disabled={!canSubmit}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Text variant="caps-14">Submit</Text>}
        </Button>
        {attemptsLeft <= 3 && (
          <Text variant="main-14" className="text-muted-foreground">
            {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left
          </Text>
        )}
      </div>

      <TestCaseTabs testCases={lesson.codingTestCases ?? []} />
    </div>
  )
}
