import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useGenerateCertificate } from '@/hooks/api/admin/useGenerateCertificate'
import type { AdminCertificateRow } from '@/lib/api/admin'

interface AdminCertificatesTableProps {
  certificates: AdminCertificateRow[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusCell({ status }: { status: AdminCertificateRow['status'] }) {
  const label = status.toUpperCase()
  const highlight = status === 'requested'
  return (
    <Text variant="caps-14" className={highlight ? 'text-primary' : undefined}>
      {label}
    </Text>
  )
}

function CertsForCourseCell({ count }: { count: number }) {
  if (count <= 1) {
    return <Text variant="caps-14">{count}</Text>
  }
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

export function AdminCertificatesTable({ certificates }: AdminCertificatesTableProps) {
  const { mutate: generate, isPending } = useGenerateCertificate()

  if (certificates.length === 0) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-14" className="text-muted-foreground">
          NO CERTIFICATES ON THIS PAGE
        </Text>
      </div>
    )
  }

  return (
    <>
      <div className="hidden lg:block border border-border">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_100px_80px_120px_140px] border-b border-border">
          <div className="p-3"><Text variant="caps-14">EMAIL</Text></div>
          <div className="p-3"><Text variant="caps-14">NAME ON CERT</Text></div>
          <div className="p-3"><Text variant="caps-14">COURSE</Text></div>
          <div className="p-5 text-center"><Text variant="caps-14">STATUS</Text></div>
          <div className="p-5 text-center"><Text variant="caps-14">CERTS</Text></div>
          <div className="p-5 text-center"><Text variant="caps-14">ISSUED AT</Text></div>
          <div className="p-5 text-center"><Text variant="caps-14">ACTION</Text></div>
        </div>

        {certificates.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_100px_80px_120px_140px] border-b border-border divide-x divide-border last:border-b-0"
          >
            <div className="p-5 min-w-0">
              <Text variant="caps-14" className="break-words">{row.userEmail.toUpperCase()}</Text>
            </div>
            <div className="p-5 min-w-0">
              <Text variant="caps-14" className="break-words">{row.name.toUpperCase()}</Text>
            </div>
            <div className="p-5 min-w-0">
              <Text variant="caps-14" className="break-words">{row.courseSlug.toUpperCase()}</Text>
            </div>
            <div className="p-5 text-center">
              <StatusCell status={row.status} />
            </div>
            <div className="p-5 text-center">
              <CertsForCourseCell count={row.certsForCourse} />
            </div>
            <div className="p-5 text-center">
              <Text variant="caps-14">{formatDate(row.issuedAt)}</Text>
            </div>
            <div className="p-5 flex items-center justify-center">
              {row.tokenId === null && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => generate({ userId: row.userId, courseSlug: row.courseSlug })}
                >
                  MINT
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:hidden">
        {certificates.map((row) => (
          <div key={row.id} className="flex flex-col gap-4 border border-border p-5">
            <div className="flex flex-col gap-1 min-w-0">
              <Text variant="caps-14" className="text-border">EMAIL</Text>
              <Text variant="caps-14" className="break-all">{row.userEmail.toUpperCase()}</Text>
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
                <StatusCell status={row.status} />
              </div>
              <div className="flex flex-col gap-1">
                <Text variant="caps-14" className="text-border">CERTS</Text>
                <CertsForCourseCell count={row.certsForCourse} />
              </div>
              <div className="flex flex-col gap-1">
                <Text variant="caps-14" className="text-border">ISSUED</Text>
                <Text variant="caps-14">{formatDate(row.issuedAt)}</Text>
              </div>
            </div>
            {row.tokenId === null && (
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => generate({ userId: row.userId, courseSlug: row.courseSlug })}
                className="self-start"
              >
                MINT
              </Button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
