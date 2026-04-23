import type { ColumnDef } from '@tanstack/react-table'
import { Text } from '@/components/ui/text'
import type { AdminUserRow } from '@/lib/api/admin'
import { formatDate } from '../shared/table-utils'

export const usersColumns: ColumnDef<AdminUserRow>[] = [
  {
    accessorKey: 'email',
    header: 'EMAIL',
    cell: ({ getValue }) => (
      <Text variant="caps-14" className="break-all">{String(getValue() ?? '').toUpperCase()}</Text>
    ),
  },
  {
    accessorKey: 'name',
    header: 'NAME',
    cell: ({ getValue }) => (
      <Text variant="caps-14">{(getValue() ? String(getValue()) : '—').toUpperCase()}</Text>
    ),
  },
  {
    accessorKey: 'role',
    header: 'ROLE',
    enableSorting: false,
    cell: ({ getValue }) => <Text variant="caps-14">{String(getValue()).toUpperCase()}</Text>,
  },
  {
    accessorKey: 'blacklisted',
    header: 'BANNED',
    enableSorting: false,
    cell: ({ getValue }) => (
      <Text variant="caps-14" className={getValue() ? 'text-destructive' : undefined}>
        {getValue() ? 'YES' : 'NO'}
      </Text>
    ),
  },
  {
    accessorKey: 'isPrivate',
    header: 'PRIVATE',
    enableSorting: false,
    cell: ({ getValue }) => <Text variant="caps-14">{getValue() ? 'YES' : 'NO'}</Text>,
  },
  {
    accessorKey: 'lessonsPassed',
    header: 'LESSONS',
    cell: ({ getValue }) => <Text variant="caps-14">{String(getValue())}</Text>,
  },
  {
    accessorKey: 'coursesPassed',
    header: 'COURSES',
    cell: ({ getValue }) => <Text variant="caps-14">{String(getValue())}</Text>,
  },
  {
    accessorKey: 'createdAt',
    header: 'JOINED',
    cell: ({ getValue }) => <Text variant="caps-14">{formatDate(String(getValue()))}</Text>,
  },
]

export const usersSortableColumns = new Set(['email', 'name', 'username', 'createdAt', 'lessonsPassed', 'coursesPassed'])
