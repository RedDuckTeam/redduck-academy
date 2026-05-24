import { getRouteApi, Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { useAdminLessonSubmissions } from '@/hooks/api/admin/useAdminLessonSubmissions'
import { AdminTablePagination } from '../shared/admin-table-pagination'
import { useAdminTableState } from '../shared/useAdminTableState'
import { cn } from '@/lib/utils'
import type { AdminLessonSubmissionItem } from '@/lib/api/admin'

const PAGE_SIZE = 20

const routeApi = getRouteApi('/admin/lessons/$courseSlug/$lessonSlug')

function StatusCell({ item }: { item: AdminLessonSubmissionItem }) {
  if (item.kind === 'coding_task') {
    return (
      <Text
        variant="caps-14"
        className={item.passed ? 'text-green-600' : 'text-red-600'}
      >
        {item.passed ? 'PASSED' : 'FAILED'}
      </Text>
    )
  }
  if (item.kind === 'review_task') {
    // pending = review still running; failed = review process errored; completed = graded → show the verdict.
    if (item.status === 'pending') {
      return <Text variant="caps-14" className="text-muted-foreground">PENDING</Text>
    }
    if (item.status === 'failed') {
      return <Text variant="caps-14" className="text-red-600">REVIEW FAILED</Text>
    }
    return (
      <Text variant="caps-14" className={item.passed ? 'text-green-600' : 'text-red-600'}>
        {item.passed ? 'PASSED' : 'NOT PASSED'}
      </Text>
    )
  }
  return (
    <Text variant="caps-14" className="text-green-600">
      COMPLETED
    </Text>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminLessonSubmissionsPage() {
  const { courseSlug, lessonSlug } = routeApi.useParams()
  const [page, setPage] = useState(1)
  const { search, handleSearchChange } = useAdminTableState<'submittedAt'>({
    initialSort: 'submittedAt',
  })

  const { data, isPending, isError, error } = useAdminLessonSubmissions({
    courseSlug,
    lessonSlug,
    page,
    search,
  })

  const totalPages = data ? Math.ceil(data.total / (data.pageSize || PAGE_SIZE)) : 0
  const showSubmissionButton =
    data?.lesson.type === 'coding_task' ||
    data?.lesson.type === 'review_task' ||
    data?.lesson.type === 'test'

  return (
    <main className="mx-5 min-h-screen py-10 lg:mx-[60px] flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          to="/admin"
          search={{ tab: 'lessons' as const }}
          className="text-secondary hover:text-black text-sm"
        >
          ← Back to Admin
        </Link>
        {data && (
          <>
            <Text variant="caps-14" className="text-border">
              {data.lesson.courseTitle.toUpperCase()} · {data.lesson.type.replace('_', ' ').toUpperCase()}
            </Text>
            <Text variant="subtitle-32" element="h1">
              {data.lesson.title}
            </Text>
            <Text variant="main-16" className="text-secondary">
              {data.total} {data.lesson.type === 'lecture' ? 'completion' : 'submission'}
              {data.total === 1 ? '' : 's'}
            </Text>
          </>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or username…"
          defaultValue={search}
          onChange={(e) => {
            setPage(1)
            handleSearchChange(e.target.value)
          }}
          className="pl-9"
        />
      </div>

      {isPending ? (
        <div className="border border-border p-10 text-center">
          <Text variant="caps-20" className="text-muted-foreground">
            LOADING…
          </Text>
        </div>
      ) : isError || !data ? (
        <div className="border border-border p-10 text-center">
          <Text variant="caps-20" className="text-muted-foreground">
            {error?.message?.toUpperCase() ?? 'FAILED TO LOAD SUBMISSIONS'}
          </Text>
        </div>
      ) : data.items.length === 0 ? (
        <div className="border border-border p-10 text-center">
          <Text variant="caps-14" className="text-muted-foreground">
            NO {data.lesson.type === 'lecture' ? 'COMPLETIONS' : 'SUBMISSIONS'} FOUND
          </Text>
        </div>
      ) : (
        <div className="border border-border">
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1.2fr_1.5fr_2fr] gap-4 px-5 py-3 border-b border-border bg-muted/30">
            <Text variant="caps-14" className="text-border">USER</Text>
            <Text variant="caps-14" className="text-border">ID</Text>
            <Text variant="caps-14" className="text-border">STATUS</Text>
            <Text variant="caps-14" className="text-border">DATE</Text>
            <Text variant="caps-14" className="text-border">ACTIONS</Text>
          </div>
          {data.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1.2fr_1.5fr_2fr] gap-3 lg:gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <Text variant="caps-14" className="lg:hidden text-border">USER</Text>
                <Text variant="caps-14" className="truncate">
                  {(item.userName || '—').toUpperCase()}
                </Text>
                {item.username && (
                  <Text variant="caps-14" className="text-secondary truncate">
                    @{item.username}
                  </Text>
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <Text variant="caps-14" className="lg:hidden text-border">ID</Text>
                <Text variant="caps-14" className="text-secondary font-mono">
                  #{item.id}
                </Text>
              </div>
              <div className="flex flex-col gap-1">
                <Text variant="caps-14" className="lg:hidden text-border">STATUS</Text>
                <StatusCell item={item} />
              </div>
              <div className="flex flex-col gap-1">
                <Text variant="caps-14" className="lg:hidden text-border">DATE</Text>
                <Text variant="caps-14" className="text-secondary">
                  {formatDate(item.submittedAt)}
                </Text>
              </div>
              <div className="flex flex-wrap gap-2">
                {showSubmissionButton && (
                  <Link
                    to="/admin/users/$userId/$courseSlug/$lessonSlug"
                    params={{
                      userId: item.userId,
                      courseSlug: data.lesson.courseSlug,
                      lessonSlug: data.lesson.slug,
                    }}
                    search={{
                      tab: 'lessons' as const,
                      email: item.userEmail ?? item.username ?? item.userId,
                      submissionId: Number(item.id),
                    }}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    View submission
                  </Link>
                )}
                <Link
                  to="/admin/users/$userId"
                  params={{ userId: item.userId }}
                  search={{ tab: 'users' as const, email: item.userEmail ?? item.username ?? item.userId }}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                >
                  View profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </main>
  )
}
