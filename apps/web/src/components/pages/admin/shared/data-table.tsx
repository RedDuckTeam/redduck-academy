import { flexRender, type Table } from '@tanstack/react-table'
import { Table as TableUI, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Text } from '@/components/ui/text'
import { SortIcon } from './sort-icon'

interface Props<TData> {
  table: Table<TData>
  sortableColumns: Set<string>
  currentSort: string
  currentDir: string
  onSortClick: (columnId: string) => void
}

export function AdminDataTable<TData>({ table, sortableColumns, currentSort, currentDir, onSortClick }: Props<TData>) {
  return (
    <div className="hidden lg:block border border-border">
      <TableUI>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = sortableColumns.has(header.column.id)
                return (
                  <TableHead key={header.id} className="p-3">
                    {canSort ? (
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => onSortClick(header.column.id)}
                      >
                        <Text variant="caps-14">{String(header.column.columnDef.header)}</Text>
                        <SortIcon columnId={header.column.id} currentSort={currentSort} currentDir={currentDir} />
                      </button>
                    ) : (
                      <Text variant="caps-14">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </Text>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="p-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </TableUI>
    </div>
  )
}
