import { Check, Download, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Text } from '@/components/ui/text'
import { CopyButton } from '../copy-button'
import { GithubSteps } from './github-steps'
import { ManualCopy } from './manual-copy'
import { useGithubHandoff } from '@/hooks/editor/useGithubHandoff'
import { downloadMarkdown, githubEditUrl } from '@/lib/editor/github-publish'
import { focusRing, noticeClass, quietNoticeClass } from '@/lib/editor/styles'
import { cn } from '@/lib/utils'

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  path: string
  content: string
}

export function PublishDialog({ open, onOpenChange, path, content }: PublishDialogProps) {
  const handoff = useGithubHandoff()
  const url = githubEditUrl(path)
  const fileName = path.slice(path.lastIndexOf('/') + 1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#000]">Publish your change</DialogTitle>
        </DialogHeader>

        <DialogBody className="gap-5 pb-6">
          <DialogDescription className="text-foreground text-[14px]">
            The last two steps happen on GitHub, in a new tab.
          </DialogDescription>

          <GithubSteps path={path} />

          {handoff.data === 'copy-failed' ? (
            <ManualCopy content={content} fileName={fileName} url={url} />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CopyButton text={content} label="Copy .md" className="w-full justify-center" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn('w-full justify-center gap-2', focusRing)}
                  onClick={() => downloadMarkdown(path, content)}
                >
                  <Download className="size-4 lg:size-5" />
                  Download .md
                </Button>
              </div>

              <Button
                type="button"
                size="md"
                className={cn('w-full justify-center gap-2', focusRing)}
                disabled={handoff.isPending}
                onClick={() => handoff.mutate({ content, url })}
              >
                {handoff.isPending && <Loader2 className="size-4 animate-spin lg:size-5" />}
                {handoff.data ? 'Open GitHub again' : 'Open on GitHub'}
              </Button>

              {handoff.data === 'opened' && (
                <div className={cn(quietNoticeClass, 'p-3')} role="status">
                  <Text variant="caps-12" element="span" className="flex items-center gap-2 text-success">
                    <Check className="size-4" />
                    Copied, and GitHub is open in a new tab
                  </Text>
                  <Text variant="main-14" className="text-muted-foreground">
                    Select everything in GitHub’s editor and paste over it. This page keeps your draft either way, so
                    come back to it if anything over there goes wrong.
                  </Text>
                </div>
              )}

              {handoff.data === 'blocked' && (
                <div className={cn(noticeClass, 'p-3')} role="status">
                  <Text variant="caps-12" element="span" className="text-primary">
                    Your browser blocked the new tab
                  </Text>
                  <Text variant="main-14" className="text-muted-foreground">
                    The file is on your clipboard. Open GitHub’s editor from here instead.
                  </Text>
                  <div>
                    <Button asChild variant="outline" size="sm" className={cn('gap-2', focusRing)}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        Open GitHub’s editor
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
