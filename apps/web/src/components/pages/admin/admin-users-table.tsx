import { Text } from '@/components/ui/text'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { AdminUserRow } from '@/lib/api/admin'

function TruncatedTooltipText({ value, className }: { value: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('block min-w-0 cursor-default', className)}>
          <Text variant="caps-14" className="block truncate">
            {value}
          </Text>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{value}</TooltipContent>
    </Tooltip>
  )
}

interface AdminUsersTableProps {
  users: AdminUserRow[]
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-14" className="text-muted-foreground">
          NO USERS ON THIS PAGE
        </Text>
      </div>
    )
  }

  return (
    <>
      <div className="hidden lg:block border border-border">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_100px_100px_100px] border-b border-border">
          <div className="p-3">
            <Text variant="caps-14">EMAIL</Text>
          </div>
          <div className="p-3">
            <Text variant="caps-14">NAME</Text>
          </div>
          <div className="p-5 text-center">
            <Text variant="caps-14">PRIVATE</Text>
          </div>
          <div className="p-5 text-center">
            <Text variant="caps-14">LESSONS</Text>
          </div>
          <div className="p-5 text-center">
            <Text variant="caps-14">COURSES</Text>
          </div>
        </div>

        {users.map((row) => (
          <div
            key={row.email}
            className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_100px_100px_100px] border-b border-border divide-x divide-border last:border-b-0"
          >
            <div className="p-5 min-w-0">
              <TruncatedTooltipText value={row.email.toUpperCase()} />
            </div>
            <div className="p-5 min-w-0">
              <TruncatedTooltipText value={row.name?.toUpperCase() ?? '—'} />
            </div>
            <div className="p-5 text-center">
              <Text variant="caps-14">{row.isPrivate ? 'YES' : 'NO'}</Text>
            </div>
            <div className="p-5 text-center">
              <Text variant="caps-14">{row.lessonsPassed}</Text>
            </div>
            <div className="p-5 text-center">
              <Text variant="caps-14">{row.coursesPassed}</Text>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:hidden">
        {users.map((row) => (
          <div key={row.email} className="flex flex-col gap-4 border border-border p-5">
            <div className="flex flex-col gap-1 min-w-0">
              <Text variant="caps-14" className="text-border">
                EMAIL
              </Text>
              <TruncatedTooltipText value={row.email.toUpperCase()} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <Text variant="caps-14" className="text-border">
                NAME
              </Text>
              <TruncatedTooltipText value={row.name?.toUpperCase() ?? '—'} />
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="flex flex-col gap-1">
                <Text variant="caps-14" className="text-border">
                  PRIVATE
                </Text>
                <Text variant="caps-14">{row.isPrivate ? 'YES' : 'NO'}</Text>
              </div>
              <div className="flex flex-col gap-1">
                <Text variant="caps-14" className="text-border">
                  LESSONS
                </Text>
                <Text variant="caps-14">{row.lessonsPassed}</Text>
              </div>
              <div className="flex flex-col gap-1">
                <Text variant="caps-14" className="text-border">
                  COURSES
                </Text>
                <Text variant="caps-14">{row.coursesPassed}</Text>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
