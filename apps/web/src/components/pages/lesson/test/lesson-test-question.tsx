import type { Ref } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import type { TestQuestion } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { RichText } from '@/components/ui/rich-text'
import { cn } from '@/lib/utils'

interface LessonTestQuestionProps {
  question: TestQuestion
  rightAnswerIds: string[]
  selectedIds: string[]
  onSelect: (optionId: string) => void
  /** `editing` = user is picking answers; `review` = locked, showing last attempt's result. */
  mode: 'editing' | 'review'
  /** Review mode: was this question answered correctly in the last submission? */
  wasCorrect: boolean
  /** Review mode: reveal the correct answers on wrong questions (controlled by the parent toggle). */
  showCorrectAnswers: boolean
  showUnansweredWarning: boolean
}

export const LessonTestQuestion = ({
  question,
  rightAnswerIds,
  selectedIds,
  onSelect,
  mode,
  wasCorrect,
  showCorrectAnswers,
  showUnansweredWarning,
}: LessonTestQuestionProps) => {
  const [warningParent] = useAutoAnimate({ duration: 180, easing: 'ease-in-out' })

  if (!question.options) return null

  const isMultiple = question.isMultipleChoices
  const isReview = mode === 'review'

  // Mark correct options green: always on correctly-answered questions (the
  // user's pick IS correct); on wrong questions only when the "Show correct
  // answers" toggle is on. Never in editing mode.
  const exposeCorrect = isReview && (wasCorrect || showCorrectAnswers)
  // Mark the user's wrong picks red — only relevant in review on a wrong answer.
  const exposeUserWrong = isReview && !wasCorrect

  return (
    <div id={`question-${question.order}`} className="flex min-w-0 w-full max-w-full flex-col scroll-mt-20">
      <div className="min-w-0 max-w-full wrap-anywhere mb-5">
        <Text variant="caps-20" className="text-primary float-left mr-1.5">
          {question.order < 10 ? `0${question.order}` : question.order}.
        </Text>
        <RichText data={question.question} className="min-w-0 [&>div>*]:mb-0" />
      </div>

      <div ref={warningParent as Ref<HTMLDivElement>}>
        {showUnansweredWarning && (
          <Text variant="caps-20" className="text-primary block mb-5">
            You should select an answer
          </Text>
        )}
      </div>

      {isMultiple ? (
        <div className="flex min-w-0 flex-col gap-3">
          {question.options.map((option) => {
            const isCorrect = rightAnswerIds.includes(option.id)
            const isSelected = selectedIds.includes(option.id)
            return (
              <label
                key={option.id}
                className={cn(
                  'flex min-w-0 w-full max-w-full cursor-pointer items-center gap-3',
                  exposeCorrect && isCorrect && 'text-success',
                  exposeUserWrong && isSelected && !isCorrect && 'text-primary',
                )}
              >
                <Checkbox
                  checked={isSelected}
                  className={cn(
                    'disabled:opacity-100',
                    exposeCorrect && isCorrect && 'border-success',
                    exposeCorrect &&
                      isSelected &&
                      isCorrect &&
                      'data-[state=checked]:bg-success data-[state=checked]:dark:bg-success',
                    exposeUserWrong && isSelected && !isCorrect && 'data-[state=checked]:bg-primary border-primary',
                  )}
                  onCheckedChange={() => onSelect(option.id)}
                  disabled={isReview}
                />
                <RichText data={option.label} className="min-w-0 flex-1 wrap-anywhere [&>div>*]:mb-0" />
              </label>
            )
          })}
        </div>
      ) : (
        <RadioGroup
          className="min-w-0"
          value={selectedIds[0] ?? ''}
          onValueChange={(value) => value && onSelect(value)}
          disabled={isReview}
        >
          <div className="flex min-w-0 flex-col gap-3">
            {question.options.map((option) => {
              const isCorrect = rightAnswerIds.includes(option.id)
              const isSelected = selectedIds.includes(option.id)
              return (
                <label
                  key={option.id}
                  className={cn(
                    'flex min-w-0 w-full max-w-full cursor-pointer items-center gap-3',
                    exposeCorrect && isCorrect && 'text-success',
                    exposeUserWrong && isSelected && !isCorrect && 'text-primary',
                  )}
                >
                  <RadioGroupItem
                    value={option.id}
                    className={cn(
                      'disabled:opacity-100',
                      exposeCorrect && isCorrect && 'border-success',
                      exposeCorrect &&
                        isSelected &&
                        isCorrect &&
                        '[&_[data-slot=radio-group-indicator]_span]:bg-success!',
                      exposeUserWrong &&
                        isSelected &&
                        !isCorrect &&
                        '[&_[data-slot=radio-group-indicator]_span]:bg-primary border-primary',
                    )}
                  />
                  <RichText data={option.label} className="min-w-0 flex-1 wrap-anywhere [&>div>*]:mb-0" />
                </label>
              )
            })}
          </div>
        </RadioGroup>
      )}
    </div>
  )
}
