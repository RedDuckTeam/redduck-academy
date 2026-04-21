import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Text } from '@/components/ui/text'
import type { RatingEntry } from '@/lib/api/user'

interface RatingTableProps {
  rating: RatingEntry[]
  currentUserId?: string
}

export const RatingTable = ({ rating, currentUserId }: RatingTableProps) => {
  if (rating.length === 0) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-20" className="text-muted-foreground">
          NO DATA YET
        </Text>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table layout */}
      <div className="hidden lg:block border border-border">
        <div className="grid grid-cols-[120px_1fr_130px_130px] border-b border-border">
          <div className="p-5">
            <Text variant="caps-20">RATING</Text>
          </div>
          <div className="p-5">
            <Text variant="caps-20">STUDENT</Text>
          </div>
          <div className="p-5 text-center">
            <Text variant="caps-20">COURSES</Text>
          </div>
          <div className="p-5 text-center">
            <Text variant="caps-20">LESSONS</Text>
          </div>
        </div>

        {rating.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId
          return (
            <div
              key={entry.userId}
              className="grid grid-cols-[120px_1fr_130px_130px] border-b border-border divide-x divide-border last:border-b-0"
            >
              <div className="p-5">
                <Text variant="caps-20" className="text-primary">
                  {String(entry.rank).padStart(2, '0')}.
                </Text>
              </div>
              <div className={cn('p-5', isCurrentUser && 'text-primary')}>
                {entry.username ? (
                  <Link
                    to="/profile/$username"
                    params={{ username: entry.username }}
                    className="group inline-flex items-center gap-1.5"
                  >
                    <Text variant="caps-20" className="underline-offset-[0.2em] group-hover:underline">
                      {entry.userName?.toUpperCase() ?? '—'}
                    </Text>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                  </Link>
                ) : (
                  <Text variant="caps-20">{entry.userName?.toUpperCase() ?? '—'}</Text>
                )}
              </div>
              <div className="p-5 text-center">
                <Text variant="caps-20">{entry.completedCoursesCount}</Text>
              </div>
              <div className="p-5 text-center">
                <Text variant="caps-20">{entry.completedLessonsCount}</Text>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col gap-4 lg:hidden">
        {rating.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId
          return (
            <div key={entry.userId} className="flex flex-col gap-4 border border-border p-5">
              <div className="flex items-center gap-3">
                <Text variant="caps-20" className="text-primary">
                  {String(entry.rank).padStart(2, '0')}.
                </Text>
                {entry.username ? (
                  <Link
                    to="/profile/$username"
                    params={{ username: entry.username }}
                    className="group inline-flex items-center gap-1.5"
                  >
                    <Text variant="caps-20" className={cn('underline-offset-[0.2em] group-hover:underline', isCurrentUser && 'text-primary')}>
                      {entry.userName?.toUpperCase() ?? '—'}
                    </Text>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                  </Link>
                ) : (
                  <Text variant="caps-20" className={cn(isCurrentUser && 'text-primary')}>
                    {entry.userName?.toUpperCase() ?? '—'}
                  </Text>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex flex-col gap-1">
                  <Text variant="caps-14" className="text-border">
                    COURSES
                  </Text>
                  <Text variant="caps-20">{entry.completedCoursesCount}</Text>
                </div>
                <div className="flex flex-col gap-1">
                  <Text variant="caps-14" className="text-border">
                    LESSONS
                  </Text>
                  <Text variant="caps-20">{entry.completedLessonsCount}</Text>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
