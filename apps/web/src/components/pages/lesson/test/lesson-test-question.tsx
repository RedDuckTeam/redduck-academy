import type { TestQuestion } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'

interface LessonTestQuestionProps {
  question: TestQuestion
  selectedIds: string[]
  onSelect: (optionId: string) => void
  disabled?: boolean
}

export const LessonTestQuestion = ({
  question,
  selectedIds,
  onSelect,
  disabled,
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
          {question.options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Checkbox
                checked={selectedIds.includes(option.id)}
                onCheckedChange={() => onSelect(option.id)}
                disabled={disabled}
              />
              <Text className="flex-1">{option.label}</Text>
            </label>
          ))}
        </div>
      ) : (
        <RadioGroup
          value={selectedIds[0] ?? ''}
          onValueChange={(value) => value && onSelect(value)}
          disabled={disabled}
        >
          <div className="flex flex-col gap-3">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-3 cursor-pointer"
              >
                <RadioGroupItem value={option.id} />
                <Text className="flex-1">{option.label}</Text>
              </label>
            ))}
          </div>
        </RadioGroup>
      )}
    </div>
  )
}
