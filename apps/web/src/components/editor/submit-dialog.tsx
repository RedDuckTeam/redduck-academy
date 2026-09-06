import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { displayNameField } from '@redduck/api-contracts'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { env } from '@/env'
import { useCreateProposal } from '@/hooks/api/proposals/useCreateProposal'
import {
  isProposalConflict,
  isProposalNetworkFailure,
  proposalConflictContent,
  proposalRetryAfterMs,
  proposalRuleViolations,
} from '@/lib/api/proposals'
import { useSession } from '@/hooks/useSession'

/**
 * Version of the licence notice below, recorded against the proposal so an acceptance can always
 * be tied back to wording we still have. Bump it whenever that text changes.
 */
const LICENSE_VERSION = '2026-09-06'

const RATIONALE_MAX = 2000

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
/** Asserted server-side, so a token minted elsewhere on the site cannot be spent on this route. */
const TURNSTILE_ACTION = 'submit-proposal'

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string | undefined
  execute: (widget: string) => void
  reset: (widget: string) => void
  remove: (widget: string) => void
}

// Read through an accessor rather than `declare global`: a transitive dependency of the Privy SDK
// already declares `Window.turnstile` with its own shape, and two ambient declarations of one
// property is a compile error in whichever file loses the race.
function turnstileApi(): TurnstileApi | null {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile ?? null
}

let turnstileScript: Promise<void> | null = null

function loadTurnstile(): Promise<void> {
  turnstileScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      // Cleared so a later attempt retries the network rather than replaying the rejection.
      turnstileScript = null
      reject(new Error('The challenge could not load. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })
  return turnstileScript
}

function formatRetryAfter(ms: number): string {
  const minutes = Math.ceil(ms / 60_000)
  if (minutes <= 1) return 'in about a minute'
  if (minutes < 60) return `in about ${minutes} minutes`
  const hours = Math.ceil(minutes / 60)
  return `in about ${hours} ${hours === 1 ? 'hour' : 'hours'}`
}

interface SubmitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
  /** The whole file as the contributor left it. Never modified here. */
  content: string
  baseHash: string
  /** The lesson moved on `main` and the contributor chose to keep their own text over it. */
  onRebase: (theirs: string) => void
  onSubmitted: () => void
}

const labelClass = 'text-muted-foreground'
const headerTextClass = 'text-[#000]'
const noticeClass = 'flex flex-col gap-2 border border-primary p-3'
const textareaClass =
  'min-h-[110px] w-full resize-y border border-border bg-transparent px-4 py-2.5 text-base text-foreground outline-none placeholder:text-muted-foreground'

export function SubmitDialog({
  open,
  onOpenChange,
  courseSlug,
  moduleSlug,
  lessonSlug,
  content,
  baseHash,
  onRebase,
  onSubmitted,
}: SubmitDialogProps) {
  const { session, isPending: sessionPending } = useSession()
  const mutation = useCreateProposal()

  const [rationale, setRationale] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [licenseAccepted, setLicenseAccepted] = useState(false)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [showTheirs, setShowTheirs] = useState(false)
  const [copied, setCopied] = useState(false)

  const widgetHostRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const pendingTokenRef = useRef<{ resolve: (token: string) => void; reject: (error: Error) => void } | null>(null)

  // Two doors, and they are equal: a Privy session skips the captcha, everyone else solves one.
  // Waiting for the session to resolve first stops a returning contributor being shown a challenge
  // for the half-second before their session is recognised.
  const needsChallenge = !sessionPending && !session
  const sitekey = env.VITE_TURNSTILE_SITE_KEY
  const challengeUnavailable = needsChallenge && !sitekey

  const result = mutation.data ?? null
  const conflict = isProposalConflict(mutation.error)
  const theirs = proposalConflictContent(mutation.error)
  const violations = proposalRuleViolations(mutation.error)
  const retryAfterMs = proposalRetryAfterMs(mutation.error)
  const networkFailure = isProposalNetworkFailure(mutation.error)
  const unexplainedError =
    mutation.isError && !conflict && !networkFailure && retryAfterMs === null && violations.length === 0

  const trimmedName = displayName.trim()
  const nameError = trimmedName.length > 0 && !displayNameField.safeParse(trimmedName).success
  const canSubmit =
    rationale.trim().length > 0 &&
    !nameError &&
    licenseAccepted &&
    !challengeUnavailable &&
    !sessionPending &&
    !mutation.isPending

  // Mounted only while the dialog is open, and only on the anonymous door. `execution: 'execute'`
  // is what defers the challenge to submit time: tokens are single-use with a 300-second TTL, so
  // one minted at page-open would routinely be expired by the time a real edit is finished.
  useEffect(() => {
    if (!open || !needsChallenge || !sitekey) return
    let cancelled = false

    loadTurnstile()
      .then(() => {
        const host = widgetHostRef.current
        const api = turnstileApi()
        if (cancelled || !host || !api) return
        widgetIdRef.current =
          api.render(host, {
            sitekey,
            action: TURNSTILE_ACTION,
            execution: 'execute',
            appearance: 'interaction-only',
            callback: (token: string) => {
              pendingTokenRef.current?.resolve(token)
              pendingTokenRef.current = null
            },
            'error-callback': () => {
              pendingTokenRef.current?.reject(new Error('The challenge failed. Please try again.'))
              pendingTokenRef.current = null
            },
            'expired-callback': () => {
              pendingTokenRef.current?.reject(new Error('The challenge expired. Please try again.'))
              pendingTokenRef.current = null
            },
          }) ?? null
      })
      .catch((error: Error) => {
        if (!cancelled) setChallengeError(error.message)
      })

    return () => {
      cancelled = true
      const widget = widgetIdRef.current
      widgetIdRef.current = null
      pendingTokenRef.current = null
      if (widget) turnstileApi()?.remove(widget)
    }
  }, [open, needsChallenge, sitekey])

  const requestToken = useCallback((): Promise<string> => {
    const widget = widgetIdRef.current
    const api = turnstileApi()
    if (!api || !widget) {
      return Promise.reject(new Error('The challenge is not ready yet. Give it a moment and try again.'))
    }
    return new Promise<string>((resolve, reject) => {
      pendingTokenRef.current = { resolve, reject }
      // A widget that has already solved once still holds its spent token, and Cloudflare rejects
      // a replay as `timeout-or-duplicate` — so every attempt starts from a fresh challenge.
      api.reset(widget)
      api.execute(widget)
    })
  }, [])

  const submit = async () => {
    setChallengeError(null)
    let turnstileToken: string | undefined

    if (needsChallenge) {
      try {
        turnstileToken = await requestToken()
      } catch (error) {
        setChallengeError(error instanceof Error ? error.message : 'The challenge failed. Please try again.')
        return
      }
    }

    mutation.mutate(
      {
        courseSlug,
        moduleSlug,
        lessonSlug,
        content,
        baseHash,
        rationale: rationale.trim(),
        displayName: trimmedName || undefined,
        licenseVersion: LICENSE_VERSION,
        turnstileToken,
      },
      { onSuccess: onSubmitted },
    )
  }

  const keepMine = (mine: string) => {
    onRebase(mine)
    setShowTheirs(false)
    mutation.reset()
  }

  const copyLink = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.prUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy the link')
    }
  }

  if (result) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className={headerTextClass}>Proposal opened</DialogTitle>
          </DialogHeader>
          <DialogBody className="gap-4 pb-6">
            <div className="flex items-center gap-2 border border-border p-3">
              <a
                href={result.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-2 text-primary underline"
              >
                <span className="truncate">{result.prUrl}</span>
                <ExternalLink className="size-4 shrink-0" />
              </a>
              <Button type="button" variant="outline" size="sm" onClick={copyLink} aria-label="Copy the link">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <Text variant="main-14" className="text-muted-foreground">
              A maintainer reviews pull request #{result.prNumber}, and once it is merged your change goes live with the
              next site rebuild. Automated checks run on it in the meantime — you can follow both on the pull request.
            </Text>
            <Text variant="main-14" className="text-muted-foreground">
              There is no way to add to a proposal from the editor. Editing and submitting again opens a separate pull
              request, so it is usually better to comment on this one.
            </Text>
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="md" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className={headerTextClass}>Propose this change</DialogTitle>
        </DialogHeader>

        <DialogBody className="gap-5 pb-6">
          <label className="flex flex-col gap-1.5">
            <Text variant="caps-12" element="span" className={labelClass}>
              What did you change, and why?
            </Text>
            <textarea
              className={textareaClass}
              value={rationale}
              maxLength={RATIONALE_MAX}
              placeholder="Fixed the account-size arithmetic in the second example — it left out the 8-byte discriminator."
              onChange={(event) => setRationale(event.target.value)}
            />
            <Text variant="main-14" className="text-muted-foreground">
              Required. One line is plenty — it is what a reviewer reads first. A typo fix is a perfectly good reason.
            </Text>
          </label>

          <label className="flex flex-col gap-1.5">
            <Text variant="caps-12" element="span" className={labelClass}>
              Name to credit (optional)
            </Text>
            <Input value={displayName} maxLength={64} onChange={(event) => setDisplayName(event.target.value)} />
            <Text variant="main-14" className={nameError ? 'text-primary' : 'text-muted-foreground'}>
              {nameError
                ? 'Use letters, numbers, spaces, dots, underscores or hyphens.'
                : 'Recorded on the commit as Proposed-by. Leave it blank to stay anonymous; no email is ever published.'}
            </Text>
          </label>

          <label className="flex cursor-pointer items-start gap-3 border border-border p-3">
            <Checkbox
              className="mt-1"
              checked={licenseAccepted}
              onCheckedChange={(checked) => setLicenseAccepted(checked === true)}
            />
            <Text variant="main-14" element="span" className="flex-1">
              I wrote this, or I have the right to submit it, and I license it irrevocably under{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                CC BY-SA 4.0
              </a>{' '}
              (MIT for code). A hyperlink or URL is sufficient attribution. This submission is public and permanent; my
              email is never published.
            </Text>
          </label>

          {needsChallenge && (
            <div className="flex flex-col gap-2">
              <div ref={widgetHostRef} />
              <Text variant="main-14" className="text-muted-foreground">
                {challengeUnavailable
                  ? 'Anonymous proposals are unavailable right now. Sign in and try again.'
                  : 'You will be asked to confirm you are human when you submit. Signing in skips this step.'}
              </Text>
            </div>
          )}

          {challengeError && (
            <Text variant="main-14" className="text-primary">
              {challengeError}
            </Text>
          )}

          {violations.length > 0 && (
            <div className={noticeClass}>
              <Text variant="caps-12" element="span" className="text-primary">
                This change cannot be proposed yet
              </Text>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {violations.map((violation) => (
                  <li key={`${violation.rule}-${violation.message}`}>
                    <Text variant="main-14" element="span">
                      {violation.message}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {conflict && (
            <div className={noticeClass}>
              <Text variant="caps-12" element="span" className="text-primary">
                This lesson changed while you were editing
              </Text>
              <Text variant="main-14" className="text-muted-foreground">
                {theirs === null
                  ? 'The file no longer exists on the main branch, so there is nothing to propose against.'
                  : 'Someone else’s edit was merged first. Keep yours and it will be proposed on top of theirs — read theirs first so you do not undo it.'}
              </Text>
              {theirs !== null && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => keepMine(theirs)}>
                      Keep my version
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowTheirs((shown) => !shown)}>
                      {showTheirs ? 'Hide theirs' : 'View theirs'}
                    </Button>
                  </div>
                  {showTheirs && (
                    <pre className="max-h-64 overflow-auto border border-border p-3 text-[13px] whitespace-pre-wrap">
                      {theirs}
                    </pre>
                  )}
                </>
              )}
            </div>
          )}

          {retryAfterMs !== null && (
            <div className={noticeClass}>
              <Text variant="main-14">
                {mutation.error?.message}. Try again {formatRetryAfter(retryAfterMs)} — nothing you wrote is lost.
              </Text>
            </div>
          )}

          {networkFailure && (
            <div className={noticeClass}>
              <Text variant="main-14">
                The request never reached us. Check your connection — your edit is still here.
              </Text>
              <div>
                <Button type="button" variant="outline" size="sm" onClick={submit}>
                  Try again
                </Button>
              </div>
            </div>
          )}

          {unexplainedError && (
            <div className={noticeClass}>
              <Text variant="main-14">{mutation.error?.message}</Text>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="md" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" size="md" className="gap-2" disabled={!canSubmit} onClick={submit}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Submit proposal
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
