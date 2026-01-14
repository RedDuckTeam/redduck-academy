import { cn } from '@/lib/utils'
import * as React from 'react'

interface LoaderProps {
  className?: string
  icon?: React.ReactNode
}

export const Loader = ({ className, icon }: LoaderProps) => {
  return (
    <div className={cn('loader-fit', className)}>
      <div className="size-[145px] flex items-center justify-center">
        <div className="size-[72px]">{icon}</div>
      </div>
    </div>
  )
}
