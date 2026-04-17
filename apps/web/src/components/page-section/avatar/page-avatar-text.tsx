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
      <div className={cn('px-3 py-3 sm:px-5 sm:py-[15px] bg-[#000] sm:ml-[30px] ml-[20px]')}>
        {typeof message === 'string' ? (
          <Text variant="caps-20" className="text-white sm:text-[20px] text-[16px]">
            {message}
          </Text>
        ) : (
          message
        )}
      </div>
      <div className="sm:h-[26px] h-[14px] sm:w-[66px] w-[50px] bg-[#000] sm:ml-[15px] ml-[11px]"></div>
      <div className="sm:h-[14px] sm:w-[32px] max-sm:hidden bg-[#000] mb-1 sm:ml-[15px]"></div>
      <div className="sm:size-[14px] size-[10px] bg-[#000]"></div>
    </div>
  )
}
