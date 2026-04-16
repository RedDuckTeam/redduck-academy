import type { ReactNode } from 'react'

import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

export interface PageAvatarTextProps {
  message: ReactNode
  className?: string
}

export const PageAvatarText = ({ message, className }: PageAvatarTextProps) => {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className={cn('px-4 py-4 sm:px-5 sm:py-[15px] bg-[#000] ml-[30px]')}>
        {typeof message === 'string' ? (
          <Text variant="caps-20" className="text-white">
            {message}
          </Text>
        ) : (
          message
        )}
      </div>
      <div className="h-[26px] w-[66px] bg-[#000] ml-[15px]"></div>
      <div className="h-[14px] w-[32px] bg-[#000] mb-1 ml-[15px]"></div>
      <div className="size-[14px] bg-[#000]"></div>
    </div>
  )
}
