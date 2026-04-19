import { Link, getRouteApi } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Text } from '@/components/ui/text'
import { buttonVariants } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { useAdminCertificates } from '@/hooks/api/admin/useAdminCertificates'
import { AdminCertificatesTable } from './admin-certificates-table'

const adminRouteApi = getRouteApi('/admin')

function visiblePages(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 0) return []
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  if (start > 2) pages.push('ellipsis')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages - 1) pages.push('ellipsis')
  pages.push(totalPages)
  return pages
}

export function AdminCertificatesTab() {
  const { certPage } = adminRouteApi.useSearch()
  const { data, isPending, isError, error } = useAdminCertificates(certPage)

  if (isPending) {
    return (
      <div className="border border-border p-10 text-center">
        <Text variant="caps-20" className="text-muted-foreground">
          LOADING…
        </Text>
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

  return (
    <div className="flex flex-col gap-8">
      <AdminCertificatesTable certificates={data.items} />

      {totalPages > 1 ? (
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
                    className={cn(
                      buttonVariants({
                        variant: certPage === item ? 'outline' : 'ghost',
                        size: 'icon',
                      }),
                    )}
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
      ) : null}
    </div>
  )
}
