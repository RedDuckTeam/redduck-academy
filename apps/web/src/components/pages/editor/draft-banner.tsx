import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { focusRing } from '@/lib/editor/styles'
import { cn } from '@/lib/utils'

// The shared Button scales its type up at `md` and again at `2xl`, which is far too loud beside the
// 14px sentence it sits next to.
const compactButtonClass = '!text-[14px] !leading-none'

interface DraftBannerProps {
  savedAt: number
  onRestore: () => void
  onDiscard: () => void
}

export function DraftBanner({ savedAt, onRestore, onDiscard }: DraftBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
      <Text variant="main-14">You have unsaved changes to this lesson from {new Date(savedAt).toLocaleString()}.</Text>
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
