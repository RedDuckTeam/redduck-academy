import { useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { LessonTestQuestion } from './lesson-test-question'
import type { Lesson } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { useLessonForUser } from '@/hooks/api/lessons/useLessonForUser'
import { useSubmitTest } from '@/hooks/api/lessons/useSubmitTest'
import { useSession } from '@/hooks/useSession'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { LessonNavigation } from '../lesson-navigation/lesson-navigation'

interface LessonTestProps {
  lesson: Lesson
  courseSlug: string
  lessonSlug: string
}

export const LessonTest = ({ lesson, courseSlug, lessonSlug }: LessonTestProps) => {
  const router = useRouter()
  const { session } = useSession()
  const { value: answers, setValue: setAnswers, clear: clearSavedAnswers } = useLocalStorageState<
    Record<string, string[]>
  >(`redduck:test-answers:${courseSlug}:${lessonSlug}`, {})
  const { data: userLesson } = useLessonForUser(courseSlug, lessonSlug)
  const { mutate: submitTest, isPending } = useSubmitTest(courseSlug, lessonSlug)

  const handleSelect = useCallback(
    (questionId: string, optionId: string, isMultiple: boolean) => {
      setAnswers((prev) => {
        const current = prev[questionId] ?? []
        if (isMultiple) {
          const isSelected = current.includes(optionId)
          const next = isSelected ? current.filter((id) => id !== optionId) : [...current, optionId]
          return { ...prev, [questionId]: next }
        }
        return { ...prev, [questionId]: [optionId] }
      })
    },
    [setAnswers],
  )

  const handleSubmit = () => {
    submitTest(
      { courseSlug, lessonSlug, answers },
      { onSuccess: () => clearSavedAnswers() },
    )
  }

  const isAllAnswersSelected =
    Object.values(answers).every((answer) => answer.length > 0) &&
    Object.values(answers).length === lesson.questions?.length
  const isCompleted = userLesson?.isCompleted ?? false

  const rightAnswers = userLesson?.correctAnswers ?? {}
  const userAnswers = isCompleted ? (userLesson?.userAnswers ?? {}) : answers

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-14">
      {lesson.questions?.map((question) => (
        <LessonTestQuestion
          key={question.id}
          question={question}
          rightAnswerIds={rightAnswers[question.id] ?? []}
          selectedIds={userAnswers[question.id] ?? []}
          onSelect={(optionId) => handleSelect(question.id, optionId, question.isMultipleChoices)}
          isCompleted={isCompleted}
        />
      ))}
      {!isCompleted && (
        <div className="flex">
          {!session ? (
            <Button className="px-[60px] max-sm:w-full" onClick={() => router.navigate({ to: '/sign-up' })}>
              <Text variant="caps-20">Sign in</Text>
            </Button>
          ) : (
            <Button
              disabled={!isAllAnswersSelected || isPending}
              className="px-[60px] max-sm:w-full"
              onClick={handleSubmit}
            >
              <Text variant="caps-20">Submit</Text>
            </Button>
          )}
        </div>
      )}
      <LessonNavigation courseSlug={courseSlug} lesson={lesson} />
    </div>
  )
}
