import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { MoreHorizontal } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { useState } from 'react'
import { Text } from '@/components/ui/text'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { AdminUserRow } from '@/lib/api/admin'
import { formatDate } from '../shared/table-utils'
import { useBanUser } from '@/hooks/api/admin/useBanUser'
import { useSetUserPrivacy } from '@/hooks/api/admin/useSetUserPrivacy'

const avatarPlaceholder = '/pages/images/avatar.webp'

function UserActionsCell({ row }: { row: { original: AdminUserRow } }) {
  const { mutate: banMutate, isPending: isBanPending } = useBanUser()
  const { mutate: privacyMutate, isPending: isPrivacyPending } = useSetUserPrivacy()
  const { id, name, blacklisted, isPrivate } = row.original
  const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false)
  const [isPrivacyConfirmOpen, setIsPrivacyConfirmOpen] = useState(false)

  const isPending = isBanPending || isPrivacyPending
  const displayName = name || 'this user'

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex items-center justify-center w-7 h-7 rounded hover:bg-muted transition-colors disabled:opacity-50"
            disabled={isPending}
            aria-label="User actions"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[160px] bg-background border border-border shadow-md p-1 animate-in fade-in-0 zoom-in-95"
          >
            <DropdownMenu.Item
              onSelect={() => setIsBanConfirmOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer outline-none hover:bg-muted transition-colors data-[highlighted]:bg-muted"
            >
              <Text variant="caps-14" className={blacklisted ? undefined : 'text-destructive'}>
                {blacklisted ? 'UNBAN USER' : 'BAN USER'}
              </Text>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => setIsPrivacyConfirmOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer outline-none hover:bg-muted transition-colors data-[highlighted]:bg-muted"
            >
              <Text variant="caps-14">{isPrivate ? 'MAKE PROFILE PUBLIC' : 'MAKE PROFILE PRIVATE'}</Text>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <ConfirmDialog
        open={isBanConfirmOpen}
        onOpenChange={setIsBanConfirmOpen}
        onConfirm={() => {
          banMutate(
            { userId: id, ban: !blacklisted },
            { onSettled: () => setIsBanConfirmOpen(false) },
          )
        }}
        title={blacklisted ? 'Unban user?' : 'Ban user?'}
        description={
          blacklisted
            ? `${displayName} will regain access to the platform.`
            : `${displayName} will lose access to the platform.`
        }
        confirmLabel={blacklisted ? 'Unban' : 'Ban'}
        isLoading={isBanPending}
      />
      <ConfirmDialog
        open={isPrivacyConfirmOpen}
        onOpenChange={setIsPrivacyConfirmOpen}
        onConfirm={() => {
          privacyMutate(
            { userId: id, isPrivate: !isPrivate },
            { onSettled: () => setIsPrivacyConfirmOpen(false) },
          )
        }}
        title={isPrivate ? 'Make profile public?' : 'Make profile private?'}
        description={
          isPrivate
            ? `${displayName}'s profile will be visible to everyone again.`
            : `${displayName}'s profile will be hidden from other users.`
        }
        confirmLabel={isPrivate ? 'Make public' : 'Make private'}
        isLoading={isPrivacyPending}
      />
    </>
  )
}

export const usersColumns: ColumnDef<AdminUserRow>[] = [
  {
    id: 'avatar',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      const { username, image } = row.original
      const avatar = (
        <img
          src={image ?? avatarPlaceholder}
          alt={username ?? ''}
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
        search={{ tab: 'users' as const, email: row.original.username ?? row.original.id }}
        className="hover:underline"
      >
        <Text variant="caps-14">{(getValue() ? String(getValue()) : '—').toUpperCase()}</Text>
      </Link>
    ),
  },
  {
    accessorKey: 'username',
    header: 'USERNAME',
    enableSorting: false,
    cell: ({ getValue }) => (
      <Text variant="caps-14" className="break-all text-secondary">{String(getValue() ?? '—')}</Text>
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
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => <UserActionsCell row={row} />,
  },
]

export const usersSortableColumns = new Set(['name', 'username', 'createdAt', 'lessonsPassed', 'coursesPassed'])
