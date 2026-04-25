import { Link } from '@tanstack/react-router'
import { Dialog, DialogContent, DialogHeader, DialogBody } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

interface CourseLockedModalProps {
  courseSlug: string
  prerequisiteCourseSlug: string
  prerequisiteCourseTitle: string
}

export function CourseLockedModal({
  courseSlug,
  prerequisiteCourseSlug,
  prerequisiteCourseTitle,
}: CourseLockedModalProps) {
  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <Text variant="caps-24" className="font-normal text-[#000]">
            Lesson not available yet
          </Text>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-6">
          <Text variant="main-20" className="text-secondary">
            Complete <span className="font-medium text-foreground">{prerequisiteCourseTitle}</span> course to unlock
            this lesson.
          </Text>
          <div className="flex flex-col gap-2 sm:flex-row text-center">
            <Button asChild className="w-full">
              <Link to="/courses/$courseSlug" params={{ courseSlug: prerequisiteCourseSlug }}>
                <Text variant="caps-20">{prerequisiteCourseTitle}</Text>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/courses/$courseSlug" params={{ courseSlug }}>
                <Text variant="caps-20">Course program</Text>
              </Link>
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
