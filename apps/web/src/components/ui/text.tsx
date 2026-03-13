import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'variant'>, VariantProps<typeof textVariants> {
  children: React.ReactNode
  element?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  className?: string
}

const textVariants = cva('', {
  variants: {
    variant: {
      'main-14': 'font-inter text-[14px] leading-[18px] min-h-[18px]',
      'main-16': 'font-inter text-[16px] leading-[20px] min-h-[20px]',
      'main-18': 'font-inter text-[18px] leading-[22px] min-h-[22px]',
      'main-20': 'font-inter text-[20px] leading-[24px] font-medium min-h-[24px]',
      'caps-12': 'text-[12px] uppercase leading-[16px] min-h-[16px]',
      'caps-14': 'text-[14px] uppercase leading-[18px] min-h-[18px]',
      'caps-20': 'text-[20px] uppercase leading-[24px] min-h-[24px]',
      'caps-24': 'text-[24px] uppercase leading-[30px] font-medium min-h-[30px]',
      'subtitle-32': 'text-[32px] leading-[38px] font-medium uppercase min-h-[38px]',
      'subtitle-45': 'text-[45px] leading-[60px] font-medium uppercase min-h-[60px]',
      'title-80': 'text-[80px] leading-[96px] font-medium uppercase min-h-[96px]',
    },
  },
  defaultVariants: {
    variant: 'main-16',
  },
})

const getElementFromVariant = (
  variant: VariantProps<typeof textVariants>['variant'],
): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' => {
  if (!variant) return 'p'

  if (variant.startsWith('main-')) return 'p'
  if (variant.startsWith('caps-')) return 'span'
  if (variant === 'subtitle-32') return 'h3'
  if (variant === 'subtitle-45') return 'h2'
  if (variant === 'title-80') return 'h1'

  return 'p'
}

export const Text = ({ children, variant, element, className, ...props }: TextProps) => {
  const Element = element || getElementFromVariant(variant)
  return (
    <Element className={cn(textVariants({ variant }), className)} {...props}>
      {children}
    </Element>
  )
}
