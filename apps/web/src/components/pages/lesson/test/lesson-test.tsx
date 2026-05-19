import { useCallback, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
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
  const posthog = usePostHog()
  const {
    value: answers,
    setValue: setAnswers,
    clear: clearSavedAnswers,
  } = useLocalStorageState<Record<string, string[]>>(`redduck:test-answers:${courseSlug}:${lessonSlug}`, {})
  const { data: userLesson } = useLessonForUser(courseSlug, lessonSlug)
  const { mutate: submitTest, isPending } = useSubmitTest(courseSlug, lessonSlug)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

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
    if (!isAllAnswersSelected) {
      setHasAttemptedSubmit(true)
      const firstUnanswered = lesson.questions?.find((q) => !(answers[q.id]?.length > 0))
      if (firstUnanswered) {
        document
          .getElementById(`question-${firstUnanswered.order}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return
    }
    posthog.capture('test_submitted', { course_slug: courseSlug, lesson_slug: lessonSlug, lesson_title: lesson.title })
    submitTest({ courseSlug, lessonSlug, answers }, { onSuccess: () => clearSavedAnswers() })
  }

  const isAllAnswersSelected =
    Object.values(answers).every((answer) => answer.length > 0) &&
    Object.values(answers).length === lesson.questions?.length
  const isCompleted = userLesson?.isCompleted ?? false

  const rightAnswers = userLesson?.correctAnswers ?? {}
  const userAnswers = isCompleted ? (userLesson?.userAnswers ?? {}) : answers

  const questions = useMemo(() => lesson.questions?.sort((a, b) => a.order - b.order) ?? [], [lesson.questions])

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-14">
      {questions.map((question) => (
        <LessonTestQuestion
          key={question.id}
          question={question}
          rightAnswerIds={rightAnswers[question.id] ?? []}
          selectedIds={userAnswers[question.id] ?? []}
          onSelect={(optionId) => handleSelect(question.id, optionId, question.isMultipleChoices)}
          isCompleted={isCompleted}
          showUnansweredWarning={hasAttemptedSubmit && !isCompleted && !(answers[question.id]?.length > 0)}
        />
      ))}
      {!isCompleted && (
        <div className="flex">
          {!session ? (
            <Button className="px-[60px] max-sm:w-full" onClick={() => router.navigate({ to: '/sign-up' })}>
              <Text variant="caps-20">Sign in</Text>
            </Button>
          ) : (
            <Button disabled={isPending} className="px-[60px] max-sm:w-full" onClick={handleSubmit}>
              <Text variant="caps-20">Submit</Text>
            </Button>
          )}
        </div>
      )}
      <LessonNavigation courseSlug={courseSlug} lesson={lesson} />
    </div>
  )
}
