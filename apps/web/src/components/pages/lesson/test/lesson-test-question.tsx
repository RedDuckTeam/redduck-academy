import type { TestQuestion } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface LessonTestQuestionProps {
  question: TestQuestion
  rightAnswerIds: string[]
  selectedIds: string[]
  onSelect: (optionId: string) => void
  isCompleted: boolean
}

export const LessonTestQuestion = ({
  question,
  rightAnswerIds,
  selectedIds,
  onSelect,
  isCompleted,
}: LessonTestQuestionProps) => {
  if (!question.options) return null

  const isMultiple = question.isMultipleChoices

  return (
    <div className="flex flex-col gap-5">
      <Text variant="main-18">
        {question.order}. {question.question}
      </Text>

      {isMultiple ? (
        <div className="flex flex-col gap-3">
          {question.options.map((option) => {
            const isCorrect = rightAnswerIds.includes(option.id)
            const isSelected = selectedIds.includes(option.id)
            return (
              <label
                key={option.id}
                className={cn(
                  'flex items-center gap-3 cursor-pointer',
                  isCompleted && isCorrect && 'text-success',
                  isCompleted && isSelected && !isCorrect && 'text-primary',
                )}
              >
                <Checkbox
                  checked={isSelected}
                  className={cn(
                    'disabled:opacity-100',
                    isCompleted && isCorrect && 'border-success',
                    isCompleted && isSelected && isCorrect && 'data-[state=checked]:bg-success',
                    isCompleted && isSelected && !isCorrect && 'data-[state=checked]:bg-primary border-primary',
                  )}
                  onCheckedChange={() => onSelect(option.id)}
                  disabled={isCompleted}
                />
                <Text className="flex-1">{option.label}</Text>
              </label>
            )
          })}
        </div>
      ) : (
        <RadioGroup
          value={selectedIds[0] ?? ''}
          onValueChange={(value) => value && onSelect(value)}
          disabled={isCompleted}
        >
          <div className="flex flex-col gap-3">
            {question.options.map((option) => {
              const isCorrect = rightAnswerIds.includes(option.id)
              const isSelected = selectedIds.includes(option.id)
              return (
                <label
                  key={option.id}
                  className={cn('flex items-center gap-3 cursor-pointer', isCompleted && isCorrect && 'text-success')}
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
                  <Text className="flex-1">{option.label}</Text>
                </label>
              )
            })}
          </div>
        </RadioGroup>
      )}
    </div>
  )
}
