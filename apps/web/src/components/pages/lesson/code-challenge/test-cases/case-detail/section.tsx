import type { ReactNode } from 'react'
import { Text } from '@/components/ui/text'

interface SectionProps {
  label: string
  children: ReactNode
}

export function Section({ label, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="main-14" className="text-muted-foreground">
        {label}
      </Text>
      {children}
    </div>
  )
}
