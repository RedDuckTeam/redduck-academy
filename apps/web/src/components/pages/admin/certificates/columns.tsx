import type { ColumnDef } from '@tanstack/react-table'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AdminCertificateRow } from '@/lib/api/admin'
import { formatDate } from '../shared/table-utils'

type MintFn = (args: { userId: string; courseSlug: string }) => void

function CertsForCourseCell({ count }: { count: number }) {
  if (count <= 1) return <Text variant="caps-14">{count}</Text>
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-dotted decoration-muted-foreground">
            <Text variant="caps-14">{count}</Text>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>User has {count} certificates for this course — may have changed their name</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function getCertificatesColumns(
  onMint: MintFn,
  isMintPending: boolean,
): ColumnDef<AdminCertificateRow>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'userEmail',
      header: 'EMAIL',
      cell: ({ getValue }) => (
        <Text variant="caps-14" className="break-all">{String(getValue() ?? '').toUpperCase()}</Text>
      ),
    },
    {
      accessorKey: 'name',
      header: 'NAME ON CERT',
      cell: ({ getValue }) => (
        <Text variant="caps-14">{String(getValue()).toUpperCase()}</Text>
      ),
    },
    {
      accessorKey: 'courseSlug',
      header: 'COURSE',
      cell: ({ getValue }) => (
        <Text variant="caps-14">{String(getValue()).toUpperCase()}</Text>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ getValue }) => {
        const status = getValue() as AdminCertificateRow['status']
        return (
          <Text variant="caps-14" className={status === 'requested' ? 'text-primary' : undefined}>
            {status.toUpperCase()}
          </Text>
        )
      },
    },
    {
      accessorKey: 'certsForCourse',
      header: 'CERTS',
      enableSorting: false,
      cell: ({ getValue }) => <CertsForCourseCell count={getValue() as number} />,
    },
    {
      accessorKey: 'issuedAt',
      header: 'ISSUED AT',
      cell: ({ getValue }) => (
        <Text variant="caps-14">{formatDate(String(getValue()))}</Text>
      ),
    },
    {
      id: 'action',
      header: 'ACTION',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.tokenId === null ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isMintPending}
            onClick={() => onMint({ userId: row.original.userId, courseSlug: row.original.courseSlug })}
          >
            MINT
          </Button>
        ) : null,
    },
  ]
}

export const certsSortableColumns = new Set(['userEmail', 'name', 'courseSlug', 'status', 'issuedAt'])
