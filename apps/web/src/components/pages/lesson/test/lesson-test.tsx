import { useCallback, useState } from 'react'
import { NextButton } from '../lecture/next-button'
import { LessonTestQuestion } from './lesson-test-question'
import type { Lesson } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { useLessonForUser } from '@/hooks/api/lessons/useLessonForUser'
import { useSubmitTest } from '@/hooks/api/lessons/useSubmitTest'

interface LessonTestProps {
  lesson: Lesson
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}

export const LessonTest = ({ lesson, courseSlug, moduleSlug, lessonSlug }: LessonTestProps) => {
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const { data: userLesson } = useLessonForUser(courseSlug, lessonSlug)
  const { mutate: submitTest, isPending } = useSubmitTest(courseSlug, lessonSlug)

  const handleSelect = useCallback((questionId: string, optionId: string, isMultiple: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? []
      if (isMultiple) {
        const isSelected = current.includes(optionId)
        const next = isSelected ? current.filter((id) => id !== optionId) : [...current, optionId]
        return { ...prev, [questionId]: next }
      }
      return { ...prev, [questionId]: [optionId] }
    })
  }, [])

  const handleSubmit = () => {
    submitTest({ courseSlug, lessonSlug, answers })
  }

  const isAllAnswersSelected =
    Object.values(answers).every((answer) => answer.length > 0) &&
    Object.values(answers).length === lesson.questions?.length
  const isCompleted = userLesson?.isCompleted ?? false

  const rightAnswers = userLesson?.correctAnswers ?? {}
  const userAnswers = isCompleted ? (userLesson?.userAnswers ?? {}) : answers

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-10">
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
      <div className="flex">
        {isCompleted ? (
          <NextButton courseSlug={courseSlug} moduleSlug={moduleSlug} lesson={lesson} className="max-sm:w-full" />
        ) : (
          <Button disabled={!isAllAnswersSelected || isPending} className="px-[60px] max-sm:w-full" onClick={handleSubmit}>
            <Text variant="caps-20">Submit</Text>
          </Button>
        )}
      </div>
    </div>
  )
}
