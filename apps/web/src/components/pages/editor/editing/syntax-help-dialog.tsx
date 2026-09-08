import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ReactNode } from 'react'

interface SyntaxHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SYNTAX: Array<{ syntax: string; what: ReactNode }> = [
  { syntax: '## Heading', what: 'Section heading. Use ### for a smaller one' },
  { syntax: '**bold**  *italic*', what: 'Bold and italic' },
  { syntax: '`code`', what: 'Inline code' },
  {
    syntax: '```solidity',
    what: (
      <>
        Code block. Also <strong className="font-semibold">rust</strong> or{' '}
        <strong className="font-semibold">typescript</strong>. Leave it off for plain text
      </>
    ),
  },
  { syntax: '- item   1. item', what: 'Lists. Indent to nest them' },
  { syntax: '> quote', what: 'Quote' },
  { syntax: '| a | b |', what: 'Table' },
  { syntax: '[text](https://…)', what: 'Link' },
  { syntax: '[text](/courses/…)', what: 'Link to another lesson on this site' },
  { syntax: '<svg>…</svg>', what: 'Diagram, pasted in as markup. Give it a <title> for screen readers' },
]

export function SyntaxHelpDialog({ open, onOpenChange }: SyntaxHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#000]">What you can write</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4 pb-6">
          <DialogDescription className="text-foreground text-[14px]">
            A lesson is plain text with a few marks in it for formatting. What you type here is the file itself.
          </DialogDescription>
          <dl className="flex flex-col gap-2">
            {SYNTAX.map(({ syntax, what }) => (
              <div key={syntax} className="flex items-baseline justify-between gap-4">
                <dt className="font-mono text-[13px] whitespace-nowrap">{syntax}</dt>
                <dd className="text-right text-[14px] text-muted-foreground">{what}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[14px] text-muted-foreground">
            A paragraph that is only a link to plgrnd.io, eth.build or YouTube is embedded in the page instead.
          </p>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
