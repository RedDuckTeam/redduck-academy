import { Link, getRouteApi } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Text } from '@/components/ui/text'
import { buttonVariants } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { useAdminUsers } from '@/hooks/api/admin/useAdminUsers'
import { AdminUsersTable } from './admin-users-table'

const adminRouteApi = getRouteApi('/admin')

function visiblePages(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 0) return []
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  if (start > 2) pages.push('ellipsis')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages - 1) pages.push('ellipsis')
  pages.push(totalPages)
  return pages
}

export function AdminUsersTab() {
  const { page } = adminRouteApi.useSearch()
  const { data, isPending, isError, error } = useAdminUsers(page)

  if (isPending) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-20" className="text-muted-foreground">
          LOADING…
        </Text>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-20" className="text-muted-foreground">
          {error?.message?.toUpperCase() ?? 'FAILED TO LOAD USERS'}
        </Text>
      </div>
    )
  }

  const totalPages = Math.ceil(data.total / data.pageSize)
  const pages = visiblePages(page, totalPages)

  return (
    <div className="flex flex-col gap-8">
      <AdminUsersTable users={data.items} />

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Link
                to="/admin"
                search={(prev) => ({ ...prev, page: Math.max(1, page - 1) })}
                disabled={page <= 1}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'gap-1 px-2.5',
                  page <= 1 && 'pointer-events-none opacity-50',
                )}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="size-4" />
                <span>Previous</span>
              </Link>
            </PaginationItem>

            {pages.map((item, idx) =>
              item === 'ellipsis' ? (
                <PaginationItem key={`e-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <Link
                    to="/admin"
                    search={(prev) => ({ ...prev, page: item })}
                    className={cn(
                      buttonVariants({
                        variant: page === item ? 'outline' : 'ghost',
                        size: 'icon',
                      }),
                    )}
                    aria-label={`Go to page ${item}`}
                    aria-current={page === item ? 'page' : undefined}
                  >
                    {item}
                  </Link>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <Link
                to="/admin"
                search={(prev) => ({ ...prev, page: Math.min(totalPages, page + 1) })}
                disabled={page >= totalPages}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'gap-1 px-2.5',
                  page >= totalPages && 'pointer-events-none opacity-50',
                )}
                aria-label="Go to next page"
              >
                <span>Next</span>
                <ChevronRight className="size-4" />
              </Link>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
