import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { focusRing } from '@/lib/editor/styles'
import { cn } from '@/lib/utils'

const compactButtonClass = '!text-[14px] !leading-none'

interface DraftBannerProps {
  savedAt: number
  onRestore: () => void
  onDiscard: () => void
}

export function DraftBanner({ savedAt, onRestore, onDiscard }: DraftBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
      <Text variant="main-14">
        You have an unfinished edit to this lesson from {new Date(savedAt).toLocaleString()}.
      </Text>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(compactButtonClass, focusRing)}
          onClick={onRestore}
        >
          Restore
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(compactButtonClass, focusRing)}
          onClick={onDiscard}
        >
          Discard
        </Button>
      </div>
    </div>
  )
}
