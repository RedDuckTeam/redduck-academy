import { useCallback, useRef, useState } from 'react'

export type SortDir = 'asc' | 'desc'

export interface AdminTableStateConfig<TSort extends string> {
  initialSort: TSort
  initialDir?: SortDir
  searchDebounceMs?: number
}

export function useAdminTableState<TSort extends string>({
  initialSort,
  initialDir = 'desc',
  searchDebounceMs = 300,
}: AdminTableStateConfig<TSort>) {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<TSort>(initialSort)
  const [sortDir, setSortDir] = useState<SortDir>(initialDir)
  const [search, setSearch] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleSearchChange = useCallback(
    (value: string) => {
      clearTimeout(searchTimeout.current)
      searchTimeout.current = setTimeout(() => {
        setSearch(value)
        setPage(1)
      }, searchDebounceMs)
    },
    [searchDebounceMs],
  )

  const handleSortClick = useCallback(
    (columnId: string) => {
      const next = columnId as TSort
      const newDir: SortDir = sortBy === next && sortDir === 'asc' ? 'desc' : 'asc'
      setSortBy(next)
      setSortDir(newDir)
      setPage(1)
    },
    [sortBy, sortDir],
  )

  return {
    page,
    setPage,
    sortBy,
    sortDir,
    search,
    handleSearchChange,
    handleSortClick,
  }
}
