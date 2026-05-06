import type { ReactNode } from 'react'

import { useTheme } from '@/components/providers/theme-context'
import { HomepageGrid } from '@/components/ui/icons/homepage-grid'
import { cn } from '@/lib/utils'

type PageGridBackgroundProps = {
  children: ReactNode
  className?: string
}

export const PageGridBackground = ({ children, className }: PageGridBackgroundProps) => {
  const { theme } = useTheme()

  return (
    <div className={cn('flex flex-col gap-9 px-5 pb-14 md:px-10 md:pb-[60px] xl:px-[60px]', className)}>
      <HomepageGrid
        className="absolute top-0 max-sm:hidden left-[60px] w-[calc(100%-121px)] z-[-1]"
        fill={theme === 'dark' ? '#222222' : '#E0DEDA'}
        lines={theme === 'dark' ? '#333333' : '#CCCCCC'}
      />
      {children}
    </div>
  )
}
