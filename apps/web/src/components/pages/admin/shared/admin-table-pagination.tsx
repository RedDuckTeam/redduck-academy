import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { visiblePages } from './table-utils'

interface AdminTablePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const AdminTablePagination = ({ page, totalPages, onPageChange }: AdminTablePaginationProps) => {
  if (totalPages <= 1) return null

  const pages = visiblePages(page, totalPages)

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'gap-1 px-2.5',
              page <= 1 && 'pointer-events-none opacity-50',
            )}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="size-4" />
            <span>Previous</span>
          </button>
        </PaginationItem>

        {pages.map((item, idx) =>
          item === 'ellipsis' ? (
            <PaginationItem key={`e-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <button
                onClick={() => onPageChange(item)}
                className={cn(buttonVariants({ variant: page === item ? 'outline' : 'ghost', size: 'icon' }))}
                aria-label={`Go to page ${item}`}
                aria-current={page === item ? 'page' : undefined}
              >
                {item}
              </button>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'gap-1 px-2.5',
              page >= totalPages && 'pointer-events-none opacity-50',
            )}
            aria-label="Go to next page"
          >
            <span>Next</span>
            <ChevronRight className="size-4" />
          </button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
