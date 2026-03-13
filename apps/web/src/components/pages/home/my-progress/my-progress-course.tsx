import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'

interface MyProgressCourseProps {
  course: Course
  index: number
}

export const MyProgressCourse = ({ course, index }: MyProgressCourseProps) => {
  return (
    <>
      <div className="p-5 col-span-6 flex items-center gap-5 border-r border-border border-t ">
        <Text className="text-primary" variant={'caps-20'}>
          {index < 10 ? `0${index + 1}` : index + 1}.
        </Text>
        <Text variant={'caps-20'}>{course.title}</Text>
      </div>
      <div className="p-5 col-span-2 flex items-center justify-center border-r border-border border-t ">
        <Text variant={'caps-20'}>8/10</Text>
      </div>
      <button className="p-5 col-span-2 flex items-center justify-center  border-t border-border">
        <Text variant={'caps-20'}>Status</Text>
      </button>
    </>
  )
}
