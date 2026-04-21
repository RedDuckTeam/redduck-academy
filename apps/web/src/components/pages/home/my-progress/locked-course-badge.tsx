import { Text } from '@/components/ui/text'
import { LockedCourseStatusTooltip } from './locked-course-status-tooltip'

const darkIcon = (
  <span
    className="inline-flex size-4.5 shrink-0 items-center justify-center rounded-none border border-[#000] text-[14px] font-semibold leading-none text-[#000]"
    aria-hidden
  >
    ?
  </span>
)

type LockedCourseBadgeProps = {
  prerequisiteCourseTitle?: string
  prerequisiteCourseSlug?: string
}

export function LockedCourseBadge({ prerequisiteCourseTitle, prerequisiteCourseSlug }: LockedCourseBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 bg-primary px-4 py-2">
      <Text variant="caps-14" className="text-[#000]">
        Not available
      </Text>
      <LockedCourseStatusTooltip
        prerequisiteCourseTitle={prerequisiteCourseTitle}
        prerequisiteCourseSlug={prerequisiteCourseSlug}
        icon={darkIcon}
      />
    </div>
  )
}
