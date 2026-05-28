import { useCallback, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
import { LessonTestQuestion } from './lesson-test-question'
import type { Lesson } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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

/** Set-equality on two arrays of option ids (order/duplicate-insensitive). */
function sameSet(a: string[] | undefined, b: string[] | undefined): boolean {
  const aSet = new Set(a ?? [])
  const bSet = new Set(b ?? [])
  if (aSet.size !== bSet.size) return false
  for (const v of aSet) if (!bSet.has(v)) return false
  return true
}

export const LessonTest = ({ lesson, courseSlug, lessonSlug }: LessonTestProps) => {
  const router = useRouter()
  const { session } = useSession()
  const posthog = usePostHog()
  const { value: answers, setValue: setAnswers } = useLocalStorageState<Record<string, string[]>>(
    `redduck:test-answers:${courseSlug}:${lessonSlug}`,
    {},
  )
  const { data: userLesson } = useLessonForUser(courseSlug, lessonSlug)
  const { mutate: submitTest, isPending } = useSubmitTest(courseSlug, lessonSlug)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  // "Try again" override — flips to editing for the retake until next submit.
  const [tryingAgain, setTryingAgain] = useState(false)
  // Toggle that reveals correct answers on wrong questions; ephemeral (resets
  // on reload). Hidden by default to preserve a meaningful retake.
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false)

  const lastSubmittedAnswers = userLesson?.userAnswers ?? null
  const correctAnswers = userLesson?.correctAnswers ?? {}
  const isCompleted = userLesson?.isCompleted ?? false
  const hasSubmission = lastSubmittedAnswers != null && Object.keys(lastSubmittedAnswers).length > 0

  // Review = a prior attempt exists and the user isn't retaking right now. A
  // passing submission locks the lesson in review; a failed one stays in review
  // until the user explicitly clicks "Try again".
  const isReviewing = !tryingAgain && hasSubmission
  const displayedAnswers = isReviewing ? (lastSubmittedAnswers ?? {}) : answers

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

  const isAllAnswersSelected =
    Object.values(answers).every((answer) => answer.length > 0) &&
    Object.values(answers).length === lesson.questions?.length

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
    submitTest(
      { courseSlug, lessonSlug, answers },
      {
        // After the mutation invalidates the lesson query, the refetched
        // `userLesson` carries the new userAnswers + isCompleted — flipping
        // `tryingAgain` off snaps us back into review against that fresh data.
        onSuccess: () => {
          setTryingAgain(false)
          setHasAttemptedSubmit(false)
          setShowCorrectAnswers(false)
        },
      },
    )
  }

  const handleTryAgain = () => {
    // Pre-populate the editor with the user's last attempt so they only have
    // to re-pick what they want to change.
    setAnswers(lastSubmittedAnswers ?? {})
    setTryingAgain(true)
    setShowCorrectAnswers(false)
    setHasAttemptedSubmit(false)
  }

  const questions = useMemo(() => lesson.questions?.sort((a, b) => a.order - b.order) ?? [], [lesson.questions])

  const questionWasCorrect = (questionId: string): boolean =>
    sameSet(lastSubmittedAnswers?.[questionId], correctAnswers[questionId])

  // Retry + toggle apply only to a failed attempt. A passed test stays locked.
  const canRetry = isReviewing && !isCompleted

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-14">
      {questions.map((question) => (
        <LessonTestQuestion
          key={question.id}
          question={question}
          rightAnswerIds={correctAnswers[question.id] ?? []}
          selectedIds={displayedAnswers[question.id] ?? []}
          onSelect={(optionId) => handleSelect(question.id, optionId, question.isMultipleChoices)}
          mode={isReviewing ? 'review' : 'editing'}
          wasCorrect={isReviewing ? questionWasCorrect(question.id) : false}
          showCorrectAnswers={showCorrectAnswers}
          showUnansweredWarning={hasAttemptedSubmit && !isReviewing && !(answers[question.id]?.length > 0)}
        />
      ))}

      {!isReviewing && (
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

      {canRetry && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <Button className="px-[60px] max-sm:w-full" onClick={handleTryAgain}>
            <Text variant="caps-20">Try again</Text>
          </Button>
          <label className="flex items-center gap-3 cursor-pointer">
            <Switch checked={showCorrectAnswers} onCheckedChange={setShowCorrectAnswers} />
            <Text variant="caps-20" className="text-secondary">
              Show correct answers
            </Text>
          </label>
        </div>
      )}

      <LessonNavigation courseSlug={courseSlug} lesson={lesson} />
    </div>
  )
}
