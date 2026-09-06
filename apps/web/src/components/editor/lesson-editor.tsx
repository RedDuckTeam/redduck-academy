import { Suspense, lazy, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { FrontmatterForm } from './frontmatter-form'
import { PreviewPane } from './preview-pane'
import { SubmitDialog } from './submit-dialog'
import { deleteDraft, draftKey, loadDraft, saveDraft } from '@/lib/editor/draft-store'
import { readFrontmatter } from '@/lib/editor/frontmatter-patch'
import { loadLessonSource, sha256Hex, splitSource } from '@/lib/editor/lesson-source'
import type { LessonDraft } from '@/lib/editor/draft-store'
import { cn } from '@/lib/utils'

// CodeMirror and its Markdown grammar are ~171 KB gzipped — `@codemirror/lang-markdown` pulls in
// lang-html, which pulls in lang-javascript and lang-css. This app already ships Monaco and
// per-grammar Shiki imports to stay under the Worker size limit, so the editor loads as its own
// chunk when someone actually opens it.
const MarkdownEditor = lazy(() => import('./markdown-editor').then((module) => ({ default: module.MarkdownEditor })))

const AUTOSAVE_DELAY_MS = 800

/** The editor needs a keyboard and a second column; below `md` the page is read-only (§3.2). */
const DESKTOP_QUERY = '(min-width: 768px)'

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(DESKTOP_QUERY)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  )
}

interface LessonEditorProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' }

const columnClass = 'flex min-h-0 min-w-0 flex-col gap-4'

export function LessonEditor({ courseSlug, moduleSlug, lessonSlug }: LessonEditorProps) {
  const isDesktop = useIsDesktop()
  const key = draftKey(courseSlug, moduleSlug, lessonSlug)

  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [source, setSource] = useState('')
  /** The file as it stands on `main`, so "changed" always means "differs from what is published". */
  const [baseline, setBaseline] = useState('')
  const [baseHash, setBaseHash] = useState('')
  const [draftOffer, setDraftOffer] = useState<LessonDraft | null>(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoad({ status: 'loading' })

    loadLessonSource(courseSlug, moduleSlug, lessonSlug)
      .then(async (loaded) => {
        if (cancelled) return
        setSource(loaded.text)
        setBaseline(loaded.text)
        setBaseHash(loaded.baseHash)
        setLoad({ status: 'ready' })

        const stored = await loadDraft(key)
        // A draft matching the published file is not a draft, it is yesterday's saved state.
        if (!cancelled && stored && stored.content !== loaded.text) setDraftOffer(stored)
      })
      .catch((error: Error) => {
        if (!cancelled) setLoad({ status: 'error', message: error.message })
      })

    return () => {
      cancelled = true
    }
  }, [courseSlug, moduleSlug, lessonSlug, key, reloadToken])

  const isDirty = load.status === 'ready' && source !== baseline

  // Debounced while typing, and flushed on `visibilitychange` — the last event a mobile browser
  // reliably fires. `beforeunload` is not used: it needs sticky activation, is unreliable on
  // mobile, and disqualifies the page from bfcache in Firefox.
  const draftRef = useRef<LessonDraft | null>(null)
  draftRef.current = isDirty ? { key, content: source, baseHash, savedAt: Date.now() } : null

  useEffect(() => {
    // While a restore is still on offer the buffer holds the published text, so the "no changes,
    // drop the row" branch would delete the very draft the contributor has not answered about yet.
    if (load.status !== 'ready' || draftOffer) return
    const draft = draftRef.current
    const timer = setTimeout(() => {
      if (draft) void saveDraft(draft)
      else void deleteDraft(key)
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [source, key, load.status, draftOffer])

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && draftRef.current) void saveDraft(draftRef.current)
    }
    document.addEventListener('visibilitychange', flush)
    return () => document.removeEventListener('visibilitychange', flush)
  }, [])

  const restoreDraft = (draft: LessonDraft) => {
    setSource(draft.content)
    // The draft's own base hash comes back with it: if `main` moved on since it was written, the
    // contributor should get the 409 and see the other change, not silently propose over it.
    setBaseHash(draft.baseHash)
    setDraftOffer(null)
  }

  const discardDraft = () => {
    setDraftOffer(null)
    void deleteDraft(key)
  }

  const handleRebase = useCallback(async (theirs: string) => {
    setBaseline(theirs)
    setBaseHash(await sha256Hex(theirs))
  }, [])

  const handleSubmitted = useCallback(() => {
    setBaseline(source)
    void deleteDraft(key)
  }, [source, key])

  const title = readFrontmatter(source)?.title ?? lessonSlug
  const { frontmatter, body } = splitSource(source)

  return (
    <main className="mx-5 mb-[60px] flex min-h-screen flex-col gap-4 pt-6 lg:mx-[60px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/courses/$courseSlug/$moduleSlug/$lessonSlug" params={{ courseSlug, moduleSlug, lessonSlug }}>
            <ArrowLeft className="mr-2 size-4" />
            Back to the lesson
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Text variant="main-14" className="text-muted-foreground">
            {isDirty ? 'Unsaved changes, kept in this browser' : 'No changes yet'}
          </Text>
          <Button
            type="button"
            size="sm"
            disabled={!isDirty || load.status !== 'ready'}
            onClick={() => setSubmitOpen(true)}
          >
            Propose change
          </Button>
        </div>
      </div>

      <Text variant="caps-14" element="span" className="text-muted-foreground">
        content/{courseSlug}/{moduleSlug}/{lessonSlug}.md
      </Text>

      {load.status === 'loading' && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {load.status === 'error' && (
        <div className="flex flex-col items-start gap-3 border border-primary p-4">
          <Text variant="main-18">{load.message}</Text>
          <Button type="button" variant="outline" size="sm" onClick={() => setReloadToken((token) => token + 1)}>
            Try again
          </Button>
        </div>
      )}

      {load.status === 'ready' && draftOffer && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
          <Text variant="main-14">
            You have unsaved changes to this lesson from {new Date(draftOffer.savedAt).toLocaleString()}.
          </Text>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => restoreDraft(draftOffer)}>
              Restore them
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={discardDraft}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {load.status === 'ready' && !isDesktop && (
        <>
          <div className="border border-border p-4">
            <Text variant="main-14" className="text-muted-foreground">
              Editing needs a larger screen. This is the lesson as it stands — open it on a laptop or desktop to propose
              a change.
            </Text>
          </div>
          <PreviewPane source={source} title={title} />
        </>
      )}

      {load.status === 'ready' && isDesktop && (
        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-2">
          <div className={columnClass}>
            <FrontmatterForm source={source} onSourceChange={setSource} />
            <Suspense
              fallback={
                <div className="flex min-h-[400px] items-center justify-center border border-border">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <MarkdownEditor
                value={body}
                onChange={(next) => setSource(frontmatter + next)}
                className="min-h-[400px] flex-1"
              />
            </Suspense>
          </div>
          <div className={cn(columnClass, 'lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1')}>
            <PreviewPane source={source} title={title} />
          </div>
        </div>
      )}

      {submitOpen && (
        <SubmitDialog
          open={submitOpen}
          onOpenChange={setSubmitOpen}
          courseSlug={courseSlug}
          moduleSlug={moduleSlug}
          lessonSlug={lessonSlug}
          content={source}
          baseHash={baseHash}
          onRebase={handleRebase}
          onSubmitted={handleSubmitted}
        />
      )}
    </main>
  )
}
