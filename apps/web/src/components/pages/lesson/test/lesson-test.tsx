import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { LessonTestQuestion } from './lesson-test-question'
import type { Lesson } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'

interface LessonTestProps {
  lesson: Lesson
}

export const LessonTest = ({ lesson }: LessonTestProps) => {
  const { courseSlug, lessonSlug } = useParams({ strict: false })

  const [answers, setAnswers] = useState<Record<string, string[]>>({})

  const handleSelect = (questionId: string, optionId: string, isMultiple: boolean) => {
    console.log(questionId, optionId, isMultiple)
    setAnswers((prev) => {
      const current = prev[questionId] ?? []
      if (isMultiple) {
        const isSelected = current.includes(optionId)
        const next = isSelected ? current.filter((id) => id !== optionId) : [...current, optionId]
        return { ...prev, [questionId]: next }
      }
      return { ...prev, [questionId]: [optionId] }
    })
  }

  const isAllAnswersSelected = Object.values(answers).every((answer) => answer.length > 0)

  return (
    <div className="flex flex-col gap-10 w-full">
      {lesson.questions?.map((question) => (
        <LessonTestQuestion
          key={question.id}
          question={question}
          selectedIds={answers[question.id] ?? []}
          onSelect={(optionId) => handleSelect(question.id, optionId, question.isMultipleChoices)}
        />
      ))}
      <div className="flex">
        <Button disabled={!isAllAnswersSelected}>
          <Text variant="caps-20">Submit</Text>
        </Button>
      </div>
    </div>
  )
}
