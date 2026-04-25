import { Search } from 'lucide-react'
import { useReactTable, getCoreRowModel, type SortingState } from '@tanstack/react-table'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { useAdminUsers } from '@/hooks/api/admin/useAdminUsers'
import { AdminDataTable } from '../shared/data-table'
import { AdminTablePagination } from '../shared/admin-table-pagination'
import { useAdminTableState } from '../shared/useAdminTableState'
import { usersColumns, usersSortableColumns } from './columns'

type UserSort = 'email' | 'name' | 'username' | 'createdAt' | 'lessonsPassed' | 'coursesPassed'

export function AdminUsersTab() {
  const { page, setPage, sortBy, sortDir, search, handleSearchChange, handleSortClick } =
    useAdminTableState<UserSort>({ initialSort: 'createdAt' })

  const { data, isPending, isError, error } = useAdminUsers({
    page,
    sortBy,
    sortDir,
    search: search || undefined,
  })

  const sorting: SortingState = [{ id: sortBy, desc: sortDir === 'desc' }]
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

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or username…"
          defaultValue={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {data.items.length === 0 ? (
        <div className="border border-border p-10 text-center">
          <Text variant="caps-14" className="text-muted-foreground">
            NO USERS FOUND
          </Text>
        </div>
      ) : (
        <>
          <AdminDataTable
            table={table}
            sortableColumns={usersSortableColumns}
            currentSort={sortBy}
            currentDir={sortDir}
            onSortClick={handleSortClick}
          />

          <div className="flex flex-col gap-4 lg:hidden">
            {data.items.map((row) => (
              <div key={row.id} className="flex flex-col gap-4 border border-border p-5">
                <div className="flex flex-col gap-1 min-w-0">
                  <Text variant="caps-14" className="text-border">
                    USERNAME
                  </Text>
                  <Text variant="caps-14" className="break-all">
                    {(row.username ?? '—').toUpperCase()}
                  </Text>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <Text variant="caps-14" className="text-border">
                    NAME
                  </Text>
                  <Text variant="caps-14">{row.name?.toUpperCase() ?? '—'}</Text>
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
      )}

      <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
