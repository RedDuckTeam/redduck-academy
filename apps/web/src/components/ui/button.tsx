import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import * as React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex h-full  cursor-pointer items-center justify-center cursor-pointer text-[16px] transition-all hover:enabled:scale-[1.03]  md:text-[20px]  lg:leading-[30px] 2xl:text-[24px] flex leading-[20px] text-foreground md:leading-[25px] disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground disabled:bg-destructive-light',
        secondary: 'bg-header text-header-foreground',
        link: 'justify-center rounded-full border border-foreground bg-muted text-foreground',
        outline: cn('border border-foreground bg-transparent text-foreground'),
        'outline-white': cn('border border-white bg-transparent text-white disabled:border-white/50'),
        ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
        'case-tab': 'bg-foreground text-white hover:!scale-100 hover:bg-foreground/90 dark:bg-[#000]',
        'case-tab-muted':
          'bg-muted text-foreground hover:!scale-100 hover:bg-muted/70 dark:bg-[#2d2d2d] dark:text-white/80',
      },
      size: {
        default: 'py-[15px] px-6 max-h-[50px] md:max-h-[56px] lg:max-h-[60px]',
        sm: 'py-1 px-3',
        md: 'py-2 px-4',
        link: 'h-[56px] w-[56px]',
        icon: 'h-9 w-9',
        tab: 'py-1.5 px-3 !text-sm md:!text-sm 2xl:!text-sm leading-none',
        free: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
