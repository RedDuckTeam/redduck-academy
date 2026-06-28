import { Text } from '@/components/ui/text'

interface LessonTitleProps {
  title: string
}
export const LessonTitle = ({ title }: LessonTitleProps) => {
  return (
    <Text element="h1" variant="subtitle-32" className="text-black">
      {title}
    </Text>
  )
}
