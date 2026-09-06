import { useMemo } from 'react'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DiffView } from './diff-view'
import { diffLines } from '@/lib/editor/line-diff'

interface ChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  baseline: string
  source: string
}

export function ChangesDialog({ open, onOpenChange, baseline, source }: ChangesDialogProps) {
  const hunks = useMemo(() => (open ? diffLines(baseline, source) : null), [open, baseline, source])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#000]">Your changes</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <DialogDescription className="text-foreground text-[14px]">
            Measured against the lesson as it is published right now.
          </DialogDescription>
          <DiffView hunks={hunks} fallback={source} label="Your changes to this lesson" />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
