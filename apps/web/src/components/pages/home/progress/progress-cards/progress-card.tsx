import { Text } from '@/components/ui/text'

interface Props {
  firstNum: string
  secondNum?: string
  text: string
}

export const ProgressCard = ({ firstNum, secondNum, text }: Props) => {
  return (
    <div className="py-6 px-[30px] min-w-[288px] bg-background flex flex-col gap-2.5">
      <div className="flex items-end gap-2.5">
        <Text variant="subtitle-45">{firstNum}</Text>
        {secondNum && (
          <Text variant="caps-20" className="leading-[40px]">
            {secondNum}
          </Text>
        )}
      </div>
      <Text variant="caps-20">{text}</Text>
    </div>
  )
}
