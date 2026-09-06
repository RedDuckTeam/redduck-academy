import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Text } from '@/components/ui/text'
import { CONTENT_REPO_LABEL, CONTENT_REPO_URL } from '@/lib/editor/github-publish'
import { cn } from '@/lib/utils'

interface HowItWorksDialogProps {
  path: string
  className?: string
}

export function HowItWorksDialog({ path, className }: HowItWorksDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'cursor-pointer text-[14px] leading-none text-primary underline-offset-4 hover:underline',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          className,
        )}
      >
        How does this work?
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How contributing works</DialogTitle>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-4">
            <DialogDescription className="text-foreground text-[14px]">
              You need a GitHub account for the last step. Nothing before it.
            </DialogDescription>

            <Text variant="main-14" className="text-muted-foreground">
              Every lesson on this site is a Markdown file in{' '}
              <a
                href={CONTENT_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {CONTENT_REPO_LABEL}
                <ExternalLink className="ml-1 inline size-3.5 align-[-2px]" aria-hidden />
              </a>
              , the open repository the site is built from. You are editing{' '}
              <span className="font-mono break-all">{path}</span>.
            </Text>

            <Text variant="main-14" className="text-muted-foreground">
              Changes reach the site through a pull request, the same way every other change does. When you publish,
              this file is copied to your clipboard and GitHub opens with it. GitHub makes your own copy of the
              repository for you, so there is nothing to set up. Once you paste and confirm, your change becomes a pull
              request for a maintainer to review.
            </Text>

            <Text variant="main-14" className="text-muted-foreground">
              After it is merged, the site rebuilds and your edit is live.
            </Text>

            <Text variant="main-14" className="text-muted-foreground">
              Nothing is sent anywhere while you write. Your draft is kept in this tab and goes away when you close it.
            </Text>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}
