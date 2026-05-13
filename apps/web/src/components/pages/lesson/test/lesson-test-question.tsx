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
  isCompleted: boolean
  showUnansweredWarning: boolean
}

export const LessonTestQuestion = ({
  question,
  rightAnswerIds,
  selectedIds,
  onSelect,
  isCompleted,
  showUnansweredWarning,
}: LessonTestQuestionProps) => {
  const [warningParent] = useAutoAnimate({ duration: 180, easing: 'ease-in-out' })

  if (!question.options) return null

  const isMultiple = question.isMultipleChoices

  return (
    <div id={`question-${question.order}`} className="flex min-w-0 w-full max-w-full flex-col gap-5 scroll-mt-20">
      <div className="min-w-0 max-w-full wrap-anywhere">
        <Text variant="caps-20" className="text-primary float-left mr-1.5">
          {question.order < 10 ? `0${question.order}` : question.order}.
        </Text>
        <RichText data={question.question} className="min-w-0 [&>div>*]:mb-0" />
      </div>

      <div ref={warningParent as Ref<HTMLDivElement>}>
        {showUnansweredWarning && (
          <Text variant="caps-20" className="text-primary">
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
                  isCompleted && isCorrect && 'text-success',
                  isCompleted && isSelected && !isCorrect && 'text-primary',
                )}
              >
                <Checkbox
                  checked={isSelected}
                  className={cn(
                    'disabled:opacity-100',
                    isCompleted && isCorrect && 'border-success',
                    isCompleted &&
                      isSelected &&
                      isCorrect &&
                      'data-[state=checked]:bg-success data-[state=checked]:dark:bg-success',
                    isCompleted && isSelected && !isCorrect && 'data-[state=checked]:bg-primary border-primary',
                  )}
                  onCheckedChange={() => onSelect(option.id)}
                  disabled={isCompleted}
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
          disabled={isCompleted}
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
                    isCompleted && isCorrect && 'text-success',
                  )}
                >
                  <RadioGroupItem
                    value={option.id}
                    className={cn(
                      'disabled:opacity-100',
                      isCompleted && isCorrect && 'border-success',
                      isCompleted &&
                        isSelected &&
                        isCorrect &&
                        '[&_[data-slot=radio-group-indicator]_span]:bg-success!',
                      isCompleted && //
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
