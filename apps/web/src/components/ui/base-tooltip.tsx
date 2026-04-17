import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type BaseTooltipProps = {
  children: React.ReactNode
  /** Accessible name for the icon-only trigger. */
  triggerLabel?: string
  /** Replaces the default info icon. */
  icon?: React.ReactNode
  contentClassName?: string
  triggerClassName?: string
  tooltipProps?: Omit<React.ComponentProps<typeof Tooltip>, 'children'>
  contentProps?: Omit<React.ComponentProps<typeof TooltipContent>, 'children' | 'className'>
}

export function BaseTooltip({
  children,
  triggerLabel = 'More information',
  icon,
  contentClassName,
  triggerClassName,
  tooltipProps,
  contentProps,
}: BaseTooltipProps) {
  return (
    <Tooltip {...tooltipProps}>
      <TooltipTrigger asChild>
        <button type="button" aria-label={triggerLabel} className={cn(triggerClassName, 'flex items-center')}>
          {icon ?? (
            <span
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-none border border-white text-[14px] font-semibold leading-none text-white"
              aria-hidden
            >
              ?
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent className={cn(contentClassName, '')} {...contentProps}>
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
