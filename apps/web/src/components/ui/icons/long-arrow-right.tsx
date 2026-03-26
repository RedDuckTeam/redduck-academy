import { cn } from '@/lib/utils'
import type { IconProps } from './types'

export const LongArrowRight = ({ className, ...props }: IconProps) => {
  return (
    <svg
      viewBox="0 0 82 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-7 w-auto shrink-0 max-md:h-3.5', className)}
      {...props}
    >
      <path
        d="M3.8147e-05 11.75V15.6667H73.5V19.5833H77.4167V15.6667H81.3334V11.75H77.4167V7.83333H73.5V11.75H3.8147e-05ZM69.5834 3.91667H73.5V7.83333H69.5834V3.91667ZM69.5834 3.91667H65.6667V0L69.5834 0V3.91667ZM69.5834 23.5H73.5V19.5833H69.5834V23.5ZM69.5834 23.5H65.6667V27.4167H69.5834V23.5Z"
        fill="#E0DEDA"
      />
    </svg>
  )
}
