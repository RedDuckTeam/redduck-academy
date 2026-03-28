import { cn } from '@/lib/utils'

/** Decorative two-column border strip (ported from landing `.separator.hideX.hideC`). */
export function FooterSeparator({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-row border-x-0 max-sm:border-x border-white/20', className)}>
      <div className="w-1/2 border-b border-t border-r-0 border-white/20" />
      <div className="w-1/2 border-b border-t border-white/20" />
    </div>
  )
}
