import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useReactTable, getCoreRowModel, type SortingState, type RowSelectionState } from '@tanstack/react-table'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useAdminCertificates } from '@/hooks/api/admin/useAdminCertificates'
import { useGenerateCertificate } from '@/hooks/api/admin/useGenerateCertificate'
import { AdminDataTable } from '../shared/data-table'
import { AdminTablePagination } from '../shared/admin-table-pagination'
import { useAdminTableState } from '../shared/useAdminTableState'
import { formatDate } from '../shared/table-utils'
import { getCertificatesColumns, certsSortableColumns } from './columns'

type CertSort = 'issuedAt' | 'userEmail' | 'courseSlug' | 'status' | 'name'
type CertStatus = 'all' | 'created' | 'requested' | 'claimed'

const STATUS_OPTIONS: CertStatus[] = ['all', 'created', 'requested', 'claimed']

export function AdminCertificatesTab() {
  const { page, setPage, sortBy, sortDir, search, handleSearchChange, handleSortClick } =
    useAdminTableState<CertSort>({ initialSort: 'issuedAt' })
  const [certStatus, setCertStatus] = useState<CertStatus>('all')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const { mutate: generate, isPending: isMintPending } = useGenerateCertificate()

  const { data, isPending, isError, error } = useAdminCertificates({
    page,
    sortBy,
    sortDir,
    status: certStatus,
    search: search || undefined,
  })

  const handleStatusChange = (s: CertStatus) => {
    setCertStatus(s)
    setPage(1)
  }

  const sorting: SortingState = [{ id: sortBy, desc: sortDir === 'desc' }]
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
  const selectedCount = table.getSelectedRowModel().rows.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name or course…"
            defaultValue={search}
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
              onClick={() => handleStatusChange(s)}
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
            currentSort={sortBy}
            currentDir={sortDir}
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

      <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
