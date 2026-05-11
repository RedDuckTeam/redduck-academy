import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { StatusIcon } from './status-icon'
import type { CaseStatus } from './utils'


interface CaseTabProps {
  index: number
  status: CaseStatus
  isSelected: boolean
  onSelect: () => void
}

export function CaseTab({ index, status, isSelected, onSelect }: CaseTabProps) {
  return (
    <Button
      type="button"
      size="tab"
      variant={isSelected ? 'case-tab' : 'case-tab-muted'}
      onClick={onSelect}
      className="flex items-center gap-1.5"
    >
      <StatusIcon status={status} />
      <Text variant="main-14">{`Case ${index + 1}`}</Text>
    </Button>
  )
}
