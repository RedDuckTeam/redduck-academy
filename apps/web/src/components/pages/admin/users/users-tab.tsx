import { useRef, useCallback } from 'react'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useReactTable, getCoreRowModel, type SortingState } from '@tanstack/react-table'
import { Text } from '@/components/ui/text'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { useAdminUsers } from '@/hooks/api/admin/useAdminUsers'
import { AdminDataTable } from '../shared/data-table'
import { visiblePages } from '../shared/table-utils'
import { usersColumns, usersSortableColumns } from './columns'

const adminRouteApi = getRouteApi('/admin')

export function AdminUsersTab() {
  const { page, userSort, userSortDir, userSearch } = adminRouteApi.useSearch()
  const navigate = useNavigate()
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const { data, isPending, isError, error } = useAdminUsers({
    page,
    sortBy: userSort,
    sortDir: userSortDir,
    search: userSearch || undefined,
  })

  const handleSearchChange = (value: string) => {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      navigate({ to: '/admin', search: (prev) => ({ ...prev, userSearch: value, page: 1 }) })
    }, 300)
  }

  const handleSortClick = useCallback((columnId: string) => {
    const newDir = userSort === columnId && userSortDir === 'asc' ? 'desc' : 'asc'
    navigate({
      to: '/admin',
      search: (prev) => ({ ...prev, userSort: columnId as typeof userSort, userSortDir: newDir, page: 1 }),
    })
  }, [userSort, userSortDir, navigate])

  const sorting: SortingState = [{ id: userSort, desc: userSortDir === 'desc' }]
  const table = useReactTable({
    data: data?.items ?? [],
    columns: usersColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 50)),
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const first = next[0]
      if (first) handleSortClick(first.id)
    },
  })

  if (isPending) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-20" className="text-muted-foreground">LOADING…</Text>
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
    <div className="flex flex-col gap-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name…"
          defaultValue={userSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {data.items.length === 0 ? (
        <div className="border border-border p-10 text-center">
          <Text variant="caps-14" className="text-muted-foreground">NO USERS FOUND</Text>
        </div>
      ) : (
        <>
          <AdminDataTable
            table={table}
            sortableColumns={usersSortableColumns}
            currentSort={userSort}
            currentDir={userSortDir}
            onSortClick={handleSortClick}
          />

          <div className="flex flex-col gap-4 lg:hidden">
            {data.items.map((row) => (
              <div key={row.email} className="flex flex-col gap-4 border border-border p-5">
                <div className="flex flex-col gap-1 min-w-0">
                  <Text variant="caps-14" className="text-border">EMAIL</Text>
                  <Text variant="caps-14" className="break-all">{(row.email ?? '').toUpperCase()}</Text>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <Text variant="caps-14" className="text-border">NAME</Text>
                  <Text variant="caps-14">{row.name?.toUpperCase() ?? '—'}</Text>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="flex flex-col gap-1">
                    <Text variant="caps-14" className="text-border">PRIVATE</Text>
                    <Text variant="caps-14">{row.isPrivate ? 'YES' : 'NO'}</Text>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Text variant="caps-14" className="text-border">LESSONS</Text>
                    <Text variant="caps-14">{row.lessonsPassed}</Text>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Text variant="caps-14" className="text-border">COURSES</Text>
                    <Text variant="caps-14">{row.coursesPassed}</Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
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
                    className={cn(buttonVariants({ variant: page === item ? 'outline' : 'ghost', size: 'icon' }))}
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
      )}
    </div>
  )
}
