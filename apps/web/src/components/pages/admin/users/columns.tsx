import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { Text } from '@/components/ui/text'
import type { AdminUserRow } from '@/lib/api/admin'
import { formatDate } from '../shared/table-utils'

const avatarPlaceholder = '/pages/images/avatar.webp'

export const usersColumns: ColumnDef<AdminUserRow>[] = [
  {
    id: 'avatar',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      const { email, username, image } = row.original
      const avatar = (
        <img
          src={image ?? avatarPlaceholder}
          alt={email}
          className="w-9 h-9 rounded-full object-cover bg-black shrink-0"
        />
      )
      if (!username) return avatar
      return (
        <Link to="/profile/$username" params={{ username }} className="block rounded-full">
          {avatar}
        </Link>
      )
    },
  },
  {
    accessorKey: 'name',
    header: 'NAME',
    cell: ({ getValue, row }) => (
      <Link
        to="/admin/users/$userId"
        params={{ userId: row.original.id }}
        search={{ tab: 'users' as const, email: row.original.email }}
        className="hover:underline"
      >
        <Text variant="caps-14">{(getValue() ? String(getValue()) : '—').toUpperCase()}</Text>
      </Link>
    ),
  },
  {
    accessorKey: 'email',
    header: 'EMAIL',
    enableSorting: false,
    cell: ({ getValue }) => (
      <Text variant="caps-14" className="break-all text-secondary">{String(getValue() ?? '')}</Text>
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
