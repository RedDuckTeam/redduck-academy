import type { ReactNode } from 'react'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

interface SettingsCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export const SettingsCard = ({ title, children, className }: SettingsCardProps) => {
  return (
    <div className={cn('flex flex-col sm:border not-last:border-b max-sm:pb-10 border-border sm:p-7 gap-5', className)}>
      <div className="flex flex-col gap-1.5">
        <Text variant="caps-20">_{title}</Text>
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

interface SettingsCardRowProps {
  label: string
  children: ReactNode
  className?: string
  labelClassName?: string
}

export const SettingsCardRow = ({ label, children, className, labelClassName }: SettingsCardRowProps) => {
  return (
    <div
      className={cn(
        'flex sm:items-center gap-1.5 sm:gap-3 max-sm:flex-col py-4 first:pt-0 last:pb-0 border-b border-dashed border-border/50 last:border-b-0',
        className,
      )}
    >
      <span className={cn('text-secondary sm:w-32 shrink-0 text-[16px] uppercase tracking-wide', labelClassName)}>
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
