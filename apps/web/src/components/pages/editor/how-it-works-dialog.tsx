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
            <DialogTitle>How this works</DialogTitle>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-4">
            <DialogDescription className="text-foreground text-[14px]">
              Only the last step needs a GitHub account, and it is free to make one.
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
              , the public repository this site is built from. You are editing{' '}
              <span className="font-mono break-all">{path}</span>.
            </Text>

            <Text variant="main-14" className="text-muted-foreground">
              Your edit reaches the site as a pull request, which is how GitHub offers a change to a project for review.
              You copy the file here, then open it on GitHub and paste it in. GitHub makes your own copy of the
              repository for you, so there is nothing to set up.
            </Text>

            <Text variant="main-14" className="text-muted-foreground">
              Once a maintainer accepts your pull request, the site rebuilds and your edit is live.
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
