import { Link } from '@tanstack/react-router'
import type { NavTarget } from './lesson-navigation'
import { Text } from '@/components/ui/text'
import { ArrowRight } from '@/components/ui/icons/arrow-right'
import { cn } from '@/lib/utils'

interface NavTileProps {
  direction: 'prev' | 'next'
  target: NavTarget | null
  courseSlug: string
  onClick?: (e: React.MouseEvent) => void
}

const COURSE_PROGRAM_LABEL = 'Course program'

export const NavTile = ({ direction, target, courseSlug, onClick }: NavTileProps) => {
  const isPrev = direction === 'prev'
  const label = isPrev ? 'Previous' : 'Next'
  const title = target?.title ?? COURSE_PROGRAM_LABEL

  const className = cn(
    'flex w-full flex-col gap-2 border border-border bg-transparent p-5 transition-colors hover:bg-muted',
    isPrev ? 'items-start text-left' : 'items-end text-right',
  )

  const content = (
    <>
      <div className="flex items-center gap-2">
        {isPrev && <ArrowRight className="rotate-180 [&_path]:fill-secondary" />}
        <Text variant="caps-20" className="text-secondary text-[18px]">
          {label}
        </Text>
        {!isPrev && <ArrowRight className="[&_path]:fill-secondary" />}
      </div>
      <Text variant="main-20" className="text-primary">
        {title}
      </Text>
    </>
  )

  if (target) {
    return (
      <Link
        to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
        params={{ courseSlug, moduleSlug: target.moduleSlug, lessonSlug: target.lessonSlug }}
        onClick={onClick}
        className={className}
      >
        {content}
      </Link>
    )
  }

  return (
    <Link to="/courses/$courseSlug" params={{ courseSlug }} onClick={onClick} className={className}>
      {content}
    </Link>
  )
}
