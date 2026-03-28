import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type HeaderMenuIconProps = HTMLAttributes<HTMLSpanElement> & {
  isOpen: boolean
}

export function HeaderMenuIcon({ isOpen, className, ...props }: HeaderMenuIconProps) {
  const bar = 'absolute left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-current transition-all duration-300 ease-out'

  return (
    <span
      className={cn('relative inline-block size-6 shrink-0 text-white', className)}
      aria-hidden
      {...props}
    >
      <span
        className={cn(bar, isOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-[5px] translate-y-0')}
      />
      <span
        className={cn(
          bar,
          'top-1/2 -translate-y-1/2',
          isOpen ? 'scale-0 opacity-0' : 'opacity-100',
        )}
      />
      <span
        className={cn(
          bar,
          isOpen ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-[5px] top-auto translate-y-0',
        )}
      />
    </span>
  )
}
