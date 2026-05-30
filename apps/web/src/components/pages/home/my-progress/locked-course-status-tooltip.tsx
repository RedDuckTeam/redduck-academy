import { Link } from '@tanstack/react-router'

import { BaseTooltip } from '@/components/ui/base-tooltip'
import { useSession } from '@/hooks/useSession'

type LockedCourseStatusTooltipProps = {
  prerequisiteCourseTitle?: string
  prerequisiteCourseSlug?: string
  icon?: React.ReactNode
}

export function LockedCourseStatusTooltip({
  prerequisiteCourseTitle,
  prerequisiteCourseSlug,
  icon,
}: LockedCourseStatusTooltipProps) {
  const { session } = useSession()
  const username = (session?.user as { username?: string } | undefined)?.username
  return (
    <BaseTooltip
      triggerLabel="Why can't I start this course?"
      contentClassName="max-w-xs text-left text-sm font-normal normal-case leading-snug"
      icon={icon}
    >
      <div className="space-y-2">
        <p>
          {prerequisiteCourseTitle && prerequisiteCourseSlug ? (
            <>
              This course unlocks after you finish{' '}
              <Link
                to="/courses/$courseSlug"
                params={{ courseSlug: prerequisiteCourseSlug }}
                className="font-medium underline underline-offset-2"
              >
                {prerequisiteCourseTitle}
              </Link>
              .
            </>
          ) : prerequisiteCourseTitle ? (
            <>
              This course unlocks after you finish <span className="font-medium">{prerequisiteCourseTitle}</span>.
            </>
          ) : (
            <>This course unlocks after you finish the required prerequisite.</>
          )}
        </p>
        <p>
          You can turn prerequisite requirements on or off in{' '}
          {username ? (
            <Link to="/profile/$username" params={{ username }} className="underline underline-offset-2">
              Profile settings
            </Link>
          ) : (
            <span className="font-medium">Profile settings</span>
          )}
          .
        </p>
      </div>
    </BaseTooltip>
  )
}
