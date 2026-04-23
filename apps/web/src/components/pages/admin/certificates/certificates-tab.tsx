import { useRef, useCallback, useMemo, useState } from 'react'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useReactTable, getCoreRowModel, type SortingState, type RowSelectionState } from '@tanstack/react-table'
import { Text } from '@/components/ui/text'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { useAdminCertificates } from '@/hooks/api/admin/useAdminCertificates'
import { useGenerateCertificate } from '@/hooks/api/admin/useGenerateCertificate'
import { AdminDataTable } from '../shared/data-table'
import { visiblePages, formatDate } from '../shared/table-utils'
import { getCertificatesColumns, certsSortableColumns } from './columns'

const adminRouteApi = getRouteApi('/admin')

const STATUS_OPTIONS = ['all', 'created', 'requested', 'claimed'] as const

export function AdminCertificatesTab() {
  const { certPage, certSort, certSortDir, certStatus, certSearch } = adminRouteApi.useSearch()
  const navigate = useNavigate()
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { mutate: generate, isPending: isMintPending } = useGenerateCertificate()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { data, isPending, isError, error } = useAdminCertificates({
    page: certPage,
    sortBy: certSort,
    sortDir: certSortDir,
    status: certStatus,
    search: certSearch || undefined,
  })

  const handleSearchChange = (value: string) => {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      navigate({ to: '/admin', search: (prev) => ({ ...prev, certSearch: value, certPage: 1 }) })
    }, 300)
  }

  const handleSortClick = useCallback((columnId: string) => {
    const newDir = certSort === columnId && certSortDir === 'asc' ? 'desc' : 'asc'
    navigate({
      to: '/admin',
      search: (prev) => ({ ...prev, certSort: columnId as typeof certSort, certSortDir: newDir, certPage: 1 }),
    })
  }, [certSort, certSortDir, navigate])

  const sorting: SortingState = [{ id: certSort, desc: certSortDir === 'desc' }]
  const columns = useMemo(() => getCertificatesColumns(generate, isMintPending), [generate, isMintPending])
  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 50)),
    state: { sorting, rowSelection },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const first = next[0]
      if (first) handleSortClick(first.id)
    },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: (row) => row.original.status === 'requested',
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
          {error?.message?.toUpperCase() ?? 'FAILED TO LOAD CERTIFICATES'}
        </Text>
      </div>
    )
  }

  const totalPages = Math.ceil(data.total / data.pageSize)
  const pages = visiblePages(certPage, totalPages)
  const selectedCount = table.getSelectedRowModel().rows.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name or course…"
            defaultValue={certSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map((s) => (
            <Button
              key={s}
              variant={certStatus === s ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => navigate({ to: '/admin', search: (prev) => ({ ...prev, certStatus: s, certPage: 1 }) })}
            >
              <Text variant="caps-14">{s.toUpperCase()}</Text>
            </Button>
          ))}
        </div>
      </div>

      {data.items.length === 0 ? (
        <div className="border border-border p-10 text-center">
          <Text variant="caps-14" className="text-muted-foreground">NO CERTIFICATES FOUND</Text>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {selectedCount > 0 && (
            <Text variant="caps-14" className="text-muted-foreground">{selectedCount} SELECTED</Text>
          )}

          <AdminDataTable
            table={table}
            sortableColumns={certsSortableColumns}
            currentSort={certSort}
            currentDir={certSortDir}
            onSortClick={handleSortClick}
          />

          <div className="flex flex-col gap-4 lg:hidden">
            {data.items.map((row) => (
              <div key={row.id} className="flex flex-col gap-4 border border-border p-5">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={rowSelection[row.id] ?? false}
                    disabled={row.status !== 'requested'}
                    onCheckedChange={(v) => setRowSelection((prev) => ({ ...prev, [row.id]: !!v }))}
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <Text variant="caps-14" className="text-border">EMAIL</Text>
                    <Text variant="caps-14" className="break-all">{(row.userEmail ?? '').toUpperCase()}</Text>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Text variant="caps-14" className="text-border">NAME ON CERT</Text>
                  <Text variant="caps-14">{row.name.toUpperCase()}</Text>
                </div>
                <div className="flex flex-col gap-1">
                  <Text variant="caps-14" className="text-border">COURSE</Text>
                  <Text variant="caps-14">{row.courseSlug.toUpperCase()}</Text>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="flex flex-col gap-1">
                    <Text variant="caps-14" className="text-border">STATUS</Text>
                    <Text variant="caps-14" className={row.status === 'requested' ? 'text-primary' : undefined}>
                      {row.status.toUpperCase()}
                    </Text>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Text variant="caps-14" className="text-border">CERTS</Text>
                    <Text variant="caps-14">{row.certsForCourse}</Text>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Text variant="caps-14" className="text-border">ISSUED</Text>
                    <Text variant="caps-14">{formatDate(row.issuedAt)}</Text>
                  </div>
                </div>
                {row.tokenId === null && (
                  <button
                    className="self-start border border-border px-3 py-1.5 text-sm disabled:opacity-50"
                    disabled={isMintPending}
                    onClick={() => generate({ userId: row.userId, courseSlug: row.courseSlug })}
                  >
                    <Text variant="caps-14">MINT</Text>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Link
                to="/admin"
                search={(prev) => ({ ...prev, certPage: Math.max(1, certPage - 1) })}
                disabled={certPage <= 1}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'gap-1 px-2.5',
                  certPage <= 1 && 'pointer-events-none opacity-50',
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
                    search={(prev) => ({ ...prev, certPage: item })}
                    className={cn(buttonVariants({ variant: certPage === item ? 'outline' : 'ghost', size: 'icon' }))}
                    aria-label={`Go to page ${item}`}
                    aria-current={certPage === item ? 'page' : undefined}
                  >
                    {item}
                  </Link>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <Link
                to="/admin"
                search={(prev) => ({ ...prev, certPage: Math.min(totalPages, certPage + 1) })}
                disabled={certPage >= totalPages}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'gap-1 px-2.5',
                  certPage >= totalPages && 'pointer-events-none opacity-50',
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
