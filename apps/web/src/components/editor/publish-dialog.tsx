import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Download, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CopyButton } from './copy-button'
import { DiffView } from './diff-view'
import { Text } from '@/components/ui/text'
import {
  copyToClipboard,
  downloadMarkdown,
  fetchPublishedFile,
  githubEditUrl,
  githubNewFileUrl,
  prefillFits,
} from '@/lib/editor/github-publish'
import { diffLines } from '@/lib/editor/line-diff'
import type { DiffHunk } from '@/lib/editor/line-diff'
import { cn } from '@/lib/utils'

// There is no submit endpoint any more. The editor's last act is a hand-off: put the finished file
// on the clipboard, open GitHub's own editor, and say — before they leave — exactly what is about
// to happen there. GitHub does the fork and the pull request for a visitor with no write access,
// which is the whole reason this is cheaper and more honest than a server-side proxy.

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Path in the content repository, e.g. `content/blockchain-basics/cryptography/hashing.md`. */
  path: string
  /** The whole file as the contributor left it. Never modified here. */
  content: string
  /** The published text this session started from — what "changed since" is measured against. */
  baseline: string
  /** The lesson moved on `main`: hand the editor the current file, buffer and baseline together. */
  onLoadCurrent: (theirs: string) => void
}

type Freshness =
  | { status: 'checking' }
  /** On `main` and identical to what we loaded, or new to the repository — either way, go. */
  | { status: 'unchanged' }
  | { status: 'new-file' }
  | { status: 'changed'; theirs: string }
  | { status: 'unknown'; message: string }

type Handoff =
  | { stage: 'idle' }
  | { stage: 'working' }
  | { stage: 'opened' }
  /** Copied, but the browser refused to open the tab — the link below is the way through. */
  | { stage: 'blocked' }
  | { stage: 'copy-failed' }

const noticeClass = 'flex flex-col gap-2 border border-primary p-3'
const quietNoticeClass = 'flex flex-col gap-2 border border-border p-3'
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export function PublishDialog({ open, onOpenChange, path, content, baseline, onLoadCurrent }: PublishDialogProps) {
  const [freshness, setFreshness] = useState<Freshness>({ status: 'checking' })
  const [handoff, setHandoff] = useState<Handoff>({ stage: 'idle' })
  const [showDiff, setShowDiff] = useState(false)
  const [recheckToken, setRecheckToken] = useState(0)
  const manualCopyRef = useRef<HTMLTextAreaElement>(null)

  const usePrefill = freshness.status === 'new-file' && prefillFits(path, content)
  const targetUrl =
    freshness.status === 'new-file' ? githubNewFileUrl(path, usePrefill ? content : undefined) : githubEditUrl(path)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setFreshness({ status: 'checking' })
    setHandoff({ stage: 'idle' })

    fetchPublishedFile(path, controller.signal)
      .then((file) => {
        if (file.status === 'missing') return setFreshness({ status: 'new-file' })
        setFreshness(file.text === baseline ? { status: 'unchanged' } : { status: 'changed', theirs: file.text })
      })
      .catch((error: Error) => {
        if (controller.signal.aborted) return
        setFreshness({
          status: 'unknown',
          message: navigator.onLine
            ? `Couldn’t reach GitHub to check (${error.message}).`
            : 'You appear to be offline, so GitHub could not be checked.',
        })
      })

    return () => controller.abort()
  }, [open, path, baseline, recheckToken])

  // Focus and select the fallback box the moment it appears: if the clipboard was refused, a manual
  // Ctrl+C is the only way out, and hunting for the text first is exactly where people give up.
  useEffect(() => {
    if (handoff.stage === 'copy-failed') manualCopyRef.current?.select()
  }, [handoff.stage])

  const publish = useCallback(async () => {
    setHandoff({ stage: 'working' })
    // Copy first and await it: opening the tab moves focus off this document, and Chrome refuses
    // `clipboard.writeText` from a document that is not focused. Order is load-bearing.
    const copied = await copyToClipboard(content)
    if (!copied) return setHandoff({ stage: 'copy-failed' })

    // `noopener`/`noreferrer` in the feature string make `window.open` return null by spec, which
    // is indistinguishable from a blocked popup — so the opener is severed on the handle instead.
    const tab = window.open(targetUrl, '_blank')
    if (tab) tab.opener = null
    setHandoff({ stage: tab ? 'opened' : 'blocked' })
  }, [content, targetUrl])

  const fileName = path.slice(path.lastIndexOf('/') + 1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#000]">Publish your change</DialogTitle>
        </DialogHeader>

        <DialogBody className="gap-5 pb-6">
          <DialogDescription className="text-foreground text-[14px]">
            The last two steps happen on GitHub, in a new tab.
          </DialogDescription>
          {freshness.status === 'checking' && (
            <div className="flex items-center gap-3" role="status">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <Text variant="main-14" className="text-muted-foreground">
                Checking whether anyone edited this lesson while you were working…
              </Text>
            </div>
          )}

          {freshness.status === 'changed' && (
            <ChangedOnMain
              theirs={freshness.theirs}
              baseline={baseline}
              showDiff={showDiff}
              onToggleDiff={() => setShowDiff((shown) => !shown)}
              onLoadCurrent={() => onLoadCurrent(freshness.theirs)}
              onPublishAnyway={() => setFreshness({ status: 'unchanged' })}
            />
          )}

          {freshness.status === 'unknown' && (
            <div className={quietNoticeClass}>
              <Text variant="caps-12" element="span" className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="size-4" />
                Couldn’t check for newer changes
              </Text>
              <Text variant="main-14" className="text-muted-foreground">
                {freshness.message} You can still publish. If someone edited this lesson since you opened it, GitHub
                will show you the difference before you commit. Read it there.
              </Text>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn('gap-2', focusRing)}
                  onClick={() => setRecheckToken((token) => token + 1)}
                >
                  <RefreshCw className="size-4" />
                  Check again
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={focusRing}
                  onClick={() => setFreshness({ status: 'unchanged' })}
                >
                  Publish anyway
                </Button>
              </div>
            </div>
          )}

          {(freshness.status === 'unchanged' || freshness.status === 'new-file') && (
            <>
              {freshness.status === 'new-file' && (
                <div className={quietNoticeClass}>
                  <Text variant="main-14" className="text-muted-foreground">
                    {usePrefill
                      ? `There is no ${path} on GitHub yet, so this creates it. GitHub’s editor opens with the file already filled in.`
                      : `There is no ${path} on GitHub yet, so this creates it. The file is too long to send in the link, so paste it in as below.`}
                  </Text>
                </div>
              )}

              <GithubSteps path={path} prefilled={usePrefill} />

              {handoff.stage === 'copy-failed' ? (
                <div className={noticeClass}>
                  <Text variant="caps-12" element="span" className="text-primary">
                    Your browser wouldn’t let us use the clipboard
                  </Text>
                  <Text variant="main-14" className="text-muted-foreground">
                    Nothing was copied. Select all of the text below, copy it yourself, then open GitHub.
                  </Text>
                  <textarea
                    ref={manualCopyRef}
                    readOnly
                    value={content}
                    aria-label={`${fileName}, the whole file, select and copy`}
                    className={cn(
                      'h-40 w-full resize-y border border-border bg-transparent p-3 font-mono text-[13px]',
                      focusRing,
                    )}
                  />
                  <div>
                    <Button asChild variant="outline" size="sm" className={cn('gap-2', focusRing)}>
                      <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                        Open GitHub’s editor
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  </div>
                </div>
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

                  <div>
                    <Button
                      type="button"
                      size="md"
                      className={cn('w-full justify-center gap-2', focusRing)}
                      disabled={handoff.stage === 'working'}
                      onClick={publish}
                    >
                      {handoff.stage === 'working' && <Loader2 className="size-4 animate-spin lg:size-5" />}
                      {handoff.stage === 'idle' || handoff.stage === 'working' ? 'Open on GitHub' : 'Open GitHub again'}
                    </Button>
                  </div>

                  {handoff.stage === 'opened' && (
                    <div className={quietNoticeClass} role="status">
                      <Text variant="caps-12" element="span" className="flex items-center gap-2 text-success">
                        <Check className="size-4" />
                        Copied, and GitHub is open in a new tab
                      </Text>
                      <Text variant="main-14" className="text-muted-foreground">
                        {usePrefill
                          ? 'The file should already be there. If the box is empty, select it and paste, your copy is on the clipboard.'
                          : 'Select everything in GitHub’s editor and paste over it.'}{' '}
                        This page keeps your draft either way, so come back to it if anything over there goes wrong.
                      </Text>
                    </div>
                  )}

                  {handoff.stage === 'blocked' && (
                    <div className={noticeClass} role="status">
                      <Text variant="caps-12" element="span" className="text-primary">
                        Your browser blocked the new tab
                      </Text>
                      <Text variant="main-14" className="text-muted-foreground">
                        The file is on your clipboard. Open GitHub’s editor from here instead.
                      </Text>
                      <div>
                        <Button asChild variant="outline" size="sm" className={cn('gap-2', focusRing)}>
                          <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                            Open GitHub’s editor
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

interface GithubStepsProps {
  path: string
  prefilled: boolean
}

/**
 * People bounce at the hand-off because a fork they did not ask for looks like something going
 * wrong. Saying it first, in the order they will see it, is what keeps them going.
 */
function GithubSteps({ path, prefilled }: GithubStepsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="caps-12" element="span" className="text-muted-foreground">
        What happens over there
      </Text>
      <ol className="flex list-decimal flex-col gap-2 pl-5 marker:text-muted-foreground">
        <li>
          <Text variant="main-14" element="span">
            GitHub opens <span className="font-mono break-all">{path}</span> in its own editor. Sign in if it asks, it
            brings you straight back.
          </Text>
        </li>
        <li>
          <Text variant="main-14" element="span">
            {prefilled
              ? 'Check the file looks right. It arrives already filled in.'
              : 'Select everything in the editor (Ctrl+A, or ⌘A on a Mac) and paste. Your version replaces what is on screen.'}
          </Text>
        </li>
        <li>
          <Text variant="main-14" element="span">
            Press <b>Commit changes…</b>, then <b>Propose changes</b>, then <b>Create pull request</b>. A maintainer
            reviews it from there, and your change goes live once it is merged.
          </Text>
        </li>
      </ol>
    </div>
  )
}

interface ChangedOnMainProps {
  theirs: string
  baseline: string
  showDiff: boolean
  onToggleDiff: () => void
  onLoadCurrent: () => void
  onPublishAnyway: () => void
}

function ChangedOnMain({
  theirs,
  baseline,
  showDiff,
  onToggleDiff,
  onLoadCurrent,
  onPublishAnyway,
}: ChangedOnMainProps) {
  const [hunks, setHunks] = useState<DiffHunk[] | null>(null)
  const [computed, setComputed] = useState(false)

  useEffect(() => {
    if (!showDiff || computed) return
    setHunks(diffLines(baseline, theirs))
    setComputed(true)
  }, [showDiff, computed, baseline, theirs])

  return (
    <div className={noticeClass}>
      <Text variant="caps-12" element="span" className="flex items-center gap-2 text-primary">
        <AlertTriangle className="size-4" />
        This lesson changed while you were editing
      </Text>
      <Text variant="main-14" className="text-muted-foreground">
        Someone else’s edit was merged after you opened this page. Pasting your version over it now would undo their
        work, and the pull request would look like an ordinary edit that nobody would notice. Load the current lesson,
        make your change in it again, and publish that. Your text is kept on the page to copy back in.
      </Text>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" className={focusRing} onClick={onLoadCurrent}>
          Load the current version
        </Button>
        <Button type="button" variant="outline" size="sm" className={focusRing} onClick={onToggleDiff}>
          {showDiff ? 'Hide what changed' : 'Show what changed'}
        </Button>
      </div>

      {showDiff && (
        <>
          <Text variant="main-14" className="text-muted-foreground">
            <span aria-hidden>−</span> what you started from, <span aria-hidden>+</span> what is on the main branch now.
          </Text>
          <DiffView hunks={hunks} fallback={theirs} label="What changed on the main branch" className="max-h-64" />
        </>
      )}

      <button
        type="button"
        onClick={onPublishAnyway}
        className={cn('self-start text-left text-[13px] text-muted-foreground underline', focusRing)}
      >
        Publish mine anyway, I’ve already accounted for their change
      </button>
    </div>
  )
}
