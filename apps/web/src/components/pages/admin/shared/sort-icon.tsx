import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface SortIconProps {
  columnId: string
  currentSort: string
  currentDir: string
}

export function SortIcon({ columnId, currentSort, currentDir }: SortIconProps) {
  if (columnId !== currentSort) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
  return currentDir === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3" />
    : <ArrowDown className="ml-1 h-3 w-3" />
}
