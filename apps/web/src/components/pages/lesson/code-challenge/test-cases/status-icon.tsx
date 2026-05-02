import { Loader2, X } from 'lucide-react'
import { CheckIcon } from '@/components/ui/icons/check'
import type { CaseStatus } from './utils'

interface StatusIconProps {
  status: CaseStatus
}

export function StatusIcon({ status }: StatusIconProps) {
  if (status === 'pass') return <CheckIcon className="h-3.5 w-3.5 [&_path]:fill-success" />
  if (status === 'fail') return <X className="h-3.5 w-3.5 text-primary" />
  if (status === 'pending') return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
  return null
}
