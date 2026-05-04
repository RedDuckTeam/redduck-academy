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
        <div className="grid grid-cols-[120px_1fr_130px] border-b border-border">
          <div className="p-5">
            <Text variant="caps-20">RANK</Text>
          </div>
          <div className="p-5">
            <Text variant="caps-20">STUDENT</Text>
          </div>
          <div className="p-5 text-center">
            <Text variant="caps-20">LESSONS</Text>
          </div>
        </div>

        {rating.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId
          return (
            <div key={entry.userId} className="grid grid-cols-[120px_1fr_130px] border-b border-border last:border-b-0">
              <div className="p-5">
                <Text variant="caps-20" className="text-primary">
                  {String(entry.rank).padStart(2, '0')}.
                </Text>
              </div>
              <div className={cn('p-5 min-w-0', isCurrentUser && 'text-primary')}>
                {entry.username ? (
                  <Link to="/profile/$username" params={{ username: entry.username }} className="group min-w-0 block">
                    <Text variant="caps-20" className="underline-offset-[0.2em] group-hover:underline break-all">
                      {entry.userName?.toUpperCase() ?? '—'}
                      <ArrowUpRight aria-hidden className="inline size-4 shrink-0 align-middle ml-1" strokeWidth={2} />
                    </Text>
                  </Link>
                ) : (
                  <Text variant="caps-20" className="break-all">
                    {entry.userName?.toUpperCase() ?? '—'}
                  </Text>
                )}
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
              <div className="flex items-start gap-3">
                <Text variant="caps-20" className="text-primary">
                  {String(entry.rank).padStart(2, '0')}.
                </Text>
                {entry.username ? (
                  <Link to="/profile/$username" params={{ username: entry.username }} className="group min-w-0 block">
                    <Text
                      variant="caps-20"
                      className={cn(
                        'underline-offset-[0.2em] group-hover:underline break-all',
                        isCurrentUser && 'text-primary',
                      )}
                    >
                      {entry.userName?.toUpperCase() ?? '—'}
                      <ArrowUpRight
                        aria-hidden
                        className={cn('inline size-4 shrink-0 align-baseline ml-1', isCurrentUser && 'text-primary')}
                        strokeWidth={2}
                      />
                    </Text>
                  </Link>
                ) : (
                  <Text variant="caps-20" className={cn('break-all', isCurrentUser && 'text-primary')}>
                    {entry.userName?.toUpperCase() ?? '—'}
                  </Text>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Text variant="caps-14" className="text-border">
                  LESSONS
                </Text>
                <Text variant="caps-20">{entry.completedLessonsCount}</Text>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
