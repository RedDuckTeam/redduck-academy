import { Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GithubSteps } from './github-steps'
import { downloadMarkdown } from '@/lib/download-markdown'
import { githubEditUrl } from '@/lib/editor/github-publish'
import { focusRing } from '@/lib/editor/styles'
import { cn } from '@/lib/utils'

interface ProposeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  path: string
  content: string
}

export function ProposeDialog({ open, onOpenChange, path, content }: ProposeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#000]">Propose your change</DialogTitle>
        </DialogHeader>

        <DialogBody className="gap-5 pb-6">
          <DialogDescription className="text-foreground text-[14px]">
            Copy the file, then open GitHub and paste it over the old one. Downloading is optional, for keeping your own
            copy.
          </DialogDescription>

          <GithubSteps path={path} />

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CopyButton text={content} label="Copy the file" className={cn('w-full justify-center', focusRing)} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('w-full justify-center gap-2', focusRing)}
                onClick={() => downloadMarkdown(path, content)}
              >
                <Download className="size-4 lg:size-5" />
                Download the file
              </Button>
            </div>

            <Button asChild size="md" className={cn('w-full justify-center gap-2', focusRing)}>
              <a href={githubEditUrl(path)} target="_blank" rel="noopener noreferrer">
                Open on GitHub
                <ExternalLink className="size-4 lg:size-5" />
              </a>
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
