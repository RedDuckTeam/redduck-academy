import { MyProgressCourse } from './my-progress-course'
import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'

interface MyProgressProps {
  courses: Course[]
}

export const MyProgress = ({ courses }: MyProgressProps) => {
  return (
    <div className="p-[60px] bg-black text-background flex flex-col gap-10">
      <Text variant={'subtitle-32'}>_MY PROGRESS</Text>
      <div className="grid grid-cols-10 border border-border">
        <div className="p-5 col-span-6">
          <Text variant={'caps-20'}>Courses</Text>
        </div>
        <div className="p-5 col-span-2 flex items-center justify-center">
          <Text variant={'caps-20'}>Points</Text>
        </div>
        <div className="p-5 col-span-2 flex items-center justify-center">
          <Text variant={'caps-20'}>Status</Text>
        </div>
        {courses.map((course, index) => (
          <MyProgressCourse key={course.id} course={course} index={index} />
        ))}
      </div>
    </div>
  )
}
