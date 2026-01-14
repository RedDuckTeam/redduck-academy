import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          '!border-concrete flex h-[59px] w-full border-b bg-transparent px-[10px] py-[15px] text-xl text-black',
          'outline-none transition-colors duration-100',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'placeholder:text-concrete',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
