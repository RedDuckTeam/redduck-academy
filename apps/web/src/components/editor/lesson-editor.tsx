import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, Columns2, Download, ExternalLink, Eye, Loader2, PenLine, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from '@/components/ui/icons/arrow-right'
import { Text } from '@/components/ui/text'
import { CopyButton } from './copy-button'
import { FrontmatterForm } from './frontmatter-form'
import { PreviewPane } from './preview-pane'
import { PublishDialog } from './publish-dialog'
import { checkContentRules } from '@/lib/editor/content-rules'
import { deleteDraft, draftKey, loadDraft, saveDraft } from '@/lib/editor/draft-store'
import { readFrontmatter } from '@/lib/editor/frontmatter-patch'
import { CONTENT_REPO_LABEL, downloadMarkdown, githubEditUrl, lessonFilePath } from '@/lib/editor/github-publish'
import { loadLessonSource, splitSource } from '@/lib/editor/lesson-source'
import type { LessonDraft } from '@/lib/editor/draft-store'
import type { EditorView } from '@codemirror/view'
import { cn } from '@/lib/utils'

// CodeMirror and its Markdown grammar are ~171 KB gzipped — `@codemirror/lang-markdown` pulls in
// lang-html, which pulls in lang-javascript and lang-css. This app already ships Monaco and
// per-grammar Shiki imports to stay under the Worker size limit, so the editor loads as its own
// chunk when someone actually opens it.
const MarkdownEditor = lazy(() => import('./markdown-editor').then((module) => ({ default: module.MarkdownEditor })))

const AUTOSAVE_DELAY_MS = 800

/** The editor needs a keyboard and a second column; below `md` the page is read-only (§3.2). */
const DESKTOP_QUERY = '(min-width: 768px)'
/** Below this a split view gives each pane too little to be worth the halving. */
const SPLIT_QUERY = '(min-width: 1024px)'

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => true,
  )
}

function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('online', onChange)
      window.addEventListener('offline', onChange)
      return () => {
        window.removeEventListener('online', onChange)
        window.removeEventListener('offline', onChange)
      }
    },
    () => navigator.onLine,
    () => true,
  )
}

interface LessonEditorProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' }
type ViewMode = 'write' | 'split' | 'preview'

const VIOLATIONS_ID = 'lesson-editor-violations'

const columnClass = 'flex min-h-0 min-w-0 flex-col gap-4'
const noticeClass = 'flex flex-col gap-2 border border-primary p-4'
const quietNoticeClass = 'flex flex-col gap-2 border border-border p-4'
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
/** Both panes pin to the viewport once the header scrolls away, and scroll their own content. */
const paneHeight = 'lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)]'

interface SupersededVersionProps {
  /** The buffer as it stood before the editor was moved onto the version that was merged. */
  text: string
  onDiscard: () => void
}

/**
 * The one place this text still exists. It is deliberately not written back into the buffer: the
 * editor holds the merged lesson now, and re-applying an edit by hand is what keeps a contribution
 * from undoing somebody else's work.
 */
function SupersededVersion({ text, onDiscard }: SupersededVersionProps) {
  return (
    <div className={noticeClass}>
      <Text variant="caps-12" element="span" className="text-primary">
        Your version, before the update
      </Text>
      <Text variant="main-14" className="text-muted-foreground">
        The editor now holds the lesson as it was merged. Copy your text out, make your change in it again, and publish
        that — this panel is the only copy left.
      </Text>
      <pre className="max-h-64 overflow-auto border border-border p-3 text-[13px] whitespace-pre-wrap" tabIndex={0}>
        {text}
      </pre>
      <div className="flex gap-2">
        <CopyButton text={text} label="Copy my version" />
        <Button type="button" variant="outline" size="sm" className={focusRing} onClick={onDiscard}>
          Discard it
        </Button>
      </div>
    </div>
  )
}

const VIEW_MODES: Array<{ mode: ViewMode; label: string; icon: typeof PenLine }> = [
  { mode: 'write', label: 'Write', icon: PenLine },
  { mode: 'split', label: 'Split', icon: Columns2 },
  { mode: 'preview', label: 'Preview', icon: Eye },
]

export function LessonEditor({ courseSlug, moduleSlug, lessonSlug }: LessonEditorProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const canSplit = useMediaQuery(SPLIT_QUERY)
  const isOnline = useIsOnline()
  const key = draftKey(courseSlug, moduleSlug, lessonSlug)
  const path = lessonFilePath(courseSlug, moduleSlug, lessonSlug)

  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [source, setSource] = useState('')
  /** The published file this session started from. "Changed" always means "differs from this". */
  const [baseline, setBaseline] = useState('')
  const [draftOffer, setDraftOffer] = useState<LessonDraft | null>(null)
  const [superseded, setSuperseded] = useState<string | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [mode, setMode] = useState<ViewMode>('split')
  const [pendingLine, setPendingLine] = useState<number | null>(null)
  const viewRef = useRef<EditorView | null>(null)

  const effectiveMode = canSplit ? mode : mode === 'split' ? 'write' : mode

  useEffect(() => {
    let cancelled = false
    setLoad({ status: 'loading' })

    loadLessonSource(courseSlug, moduleSlug, lessonSlug)
      .then(async (text) => {
        if (cancelled) return
        setSource(text)
        setBaseline(text)
        setLoad({ status: 'ready' })

        const stored = await loadDraft(key)
        // A draft matching the published file is not a draft, it is yesterday's saved state.
        if (!cancelled && stored && stored.content !== text) setDraftOffer(stored)
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
  draftRef.current = isDirty ? { key, content: source, baseline, savedAt: Date.now() } : null

  useEffect(() => {
    // While a restore is still on offer the buffer holds the published text, so the "no changes,
    // drop the row" branch would delete the very draft the contributor has not answered about yet.
    if (load.status !== 'ready' || draftOffer) return
    const draft = draftRef.current
    const timer = setTimeout(() => {
      if (!draft) return void deleteDraft(key)
      void saveDraft(draft).then(() => setSavedAt(draft.savedAt))
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

  // The editor stays mounted when a pane is hidden — unmounting it would throw away undo history
  // and the cursor — so CodeMirror has to be told to re-measure when it comes back on screen.
  useEffect(() => {
    if (effectiveMode !== 'preview') viewRef.current?.requestMeasure()
  }, [effectiveMode])

  const restoreDraft = (draft: LessonDraft) => {
    setSource(draft.content)
    // The draft's own baseline comes back with it: if `main` moved on since it was written, the
    // publish step should show that change, not quietly measure against today's file.
    if (draft.baseline !== undefined) setBaseline(draft.baseline)
    setDraftOffer(null)
  }

  const discardDraft = () => {
    setDraftOffer(null)
    setSavedAt(null)
    void deleteDraft(key)
  }

  // Buffer and baseline move together, always. Advancing the baseline to the merged file while the
  // buffer still held the old one would make the next publish look clean while silently reverting
  // what was merged — no conflict, and a diff that reads as an ordinary edit. The contributor's
  // text is handed back to re-apply deliberately instead.
  const handleLoadCurrent = useCallback(
    (theirs: string) => {
      setSuperseded(source)
      setSource(theirs)
      setBaseline(theirs)
      setPublishOpen(false)
    },
    [source],
  )

  const title = readFrontmatter(source)?.title ?? lessonSlug
  const { frontmatter, body } = splitSource(source)

  // Run on every keystroke so a destructive edit is caught while it is being made. CI on the pull
  // request stays the authority; these two are the ones that are cheap to evaluate continuously
  // and expensive to discover late, because both silently delete content from the live page.
  const violations = useMemo(
    () => (load.status === 'ready' ? checkContentRules(baseline, source) : []),
    [load.status, baseline, source],
  )

  /** Violations carry file line numbers; CodeMirror holds the body only. */
  const frontmatterLines = frontmatter ? frontmatter.split('\n').length - 1 : 0

  // Recorded rather than performed: from the preview-only view the editor is still `display: none`
  // when the click is handled, and neither scrolling nor focusing a hidden element does anything.
  const goToLine = (fileLine: number) => {
    if (effectiveMode === 'preview') setMode('write')
    setPendingLine(fileLine)
  }

  useEffect(() => {
    const view = viewRef.current
    if (pendingLine === null || !view || effectiveMode === 'preview') return
    setPendingLine(null)
    const bodyLine = pendingLine - frontmatterLines
    if (bodyLine < 1) return
    const line = view.state.doc.line(Math.min(bodyLine, view.state.doc.lines))
    view.dispatch({ selection: { anchor: line.from }, scrollIntoView: true })
    view.focus()
  }, [pendingLine, effectiveMode, frontmatterLines])

  return (
    <main className="mx-5 mb-[60px] flex min-h-screen flex-col gap-4 pt-6 lg:mx-[60px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {load.status === 'ready' && isDesktop ? (
          <div role="group" aria-label="Panes" className="flex border border-border">
            {VIEW_MODES.filter(({ mode: value }) => value !== 'split' || canSplit).map(
              ({ mode: value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={effectiveMode === value}
                  onClick={() => setMode(value)}
                  className={cn(
                    // leading-none so the label's line box matches the icon's, otherwise the mono
                    // font's descender pushes the text below the icon's centre.
                    'inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-[14px] leading-none transition-colors',
                    focusRing,
                    effectiveMode === value ? 'bg-foreground text-background' : 'hover:bg-muted',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </button>
              ),
            )}
          </div>
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center gap-3">
          {/* Silent until there is something to report — an idle "No changes yet" is noise on a
              page whose whole point is that you have not typed anything yet. */}
          {isDirty && (
            <Text variant="main-14" role="status" className="text-muted-foreground">
              {savedAt ? 'Saved in this browser' : 'Unsaved changes, kept in this browser'}
            </Text>
          )}
          {isDesktop && (
            <Button
              type="button"
              size="sm"
              className={focusRing}
              disabled={!isDirty || load.status !== 'ready' || violations.length > 0}
              aria-describedby={violations.length > 0 ? VIOLATIONS_ID : undefined}
              onClick={() => setPublishOpen(true)}
            >
              Publish on GitHub
            </Button>
          )}
        </div>
      </div>

      {!isOnline && (
        <div className={cn(quietNoticeClass, 'flex-row items-center gap-3')} role="status">
          <WifiOff className="size-4 shrink-0 text-muted-foreground" />
          <Text variant="main-14" className="text-muted-foreground">
            You are offline. Keep editing — everything is saved in this browser — but publishing needs a connection.
          </Text>
        </div>
      )}

      {load.status === 'loading' && <LoadingSkeleton />}

      {load.status === 'error' && (
        <div className={cn(noticeClass, 'items-start')} role="alert">
          <Text variant="caps-12" element="span" className="flex items-center gap-2 text-primary">
            <AlertTriangle className="size-4" />
            This lesson could not be opened
          </Text>
          <Text variant="main-18">{load.message}</Text>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={focusRing}
              onClick={() => setReloadToken((token) => token + 1)}
            >
              Try again
            </Button>
            <Button asChild variant="outline" size="sm" className={cn('gap-2', focusRing)}>
              <a href={githubEditUrl(path)} target="_blank" rel="noopener noreferrer">
                Edit it on GitHub instead
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      )}

      {load.status === 'ready' && draftOffer && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
          <Text variant="main-14">
            You have unsaved changes to this lesson from {new Date(draftOffer.savedAt).toLocaleString()}.
          </Text>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={focusRing}
              onClick={() => restoreDraft(draftOffer)}
            >
              Restore them
            </Button>
            <Button type="button" variant="outline" size="sm" className={focusRing} onClick={discardDraft}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {superseded !== null && <SupersededVersion text={superseded} onDiscard={() => setSuperseded(null)} />}

      {/* Outside the panes: it is why the Publish button is disabled, so it has to stay on screen
          in the preview-only view too — and `aria-describedby` has to resolve to something. */}
      {violations.length > 0 && isDesktop && (
        <ViolationList violations={violations} frontmatterLines={frontmatterLines} onGoToLine={goToLine} />
      )}

      {load.status === 'ready' && !isDesktop && <ReadOnlyOnSmallScreen path={path} source={source} title={title} />}

      {load.status === 'ready' && isDesktop && (
        <div className={cn('grid min-h-0 flex-1 gap-6 lg:items-start', effectiveMode === 'split' && 'lg:grid-cols-2')}>
          <div className={cn(columnClass, paneHeight, 'lg:overflow-y-auto', effectiveMode === 'preview' && 'hidden')}>
            {!isDirty && <FirstRunNote path={path} />}
            <FrontmatterForm source={source} onSourceChange={setSource} />
            <Suspense
              fallback={
                <div className="flex min-h-[400px] flex-1 items-center justify-center border border-border">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <MarkdownEditor
                value={body}
                onChange={(next) => setSource(frontmatter + next)}
                onViewReady={(view) => {
                  viewRef.current = view
                }}
                className="min-h-[400px] flex-1"
              />
            </Suspense>
          </div>

          {effectiveMode !== 'write' && (
            <div className={cn(columnClass, paneHeight, 'overflow-x-hidden overflow-y-auto lg:pr-1')}>
              <PreviewPane source={source} title={title} />
            </div>
          )}
        </div>
      )}

      <Link
        to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
        params={{ courseSlug, moduleSlug, lessonSlug }}
        className={cn(
          'mt-2 flex w-full items-center gap-2 border border-border bg-transparent p-5 transition-colors hover:bg-muted',
          focusRing,
        )}
      >
        <ArrowRight className="rotate-180 [&_path]:fill-secondary" />
        <Text variant="caps-20" className="text-secondary text-[18px]">
          Back to the lesson
        </Text>
      </Link>

      {publishOpen && (
        <PublishDialog
          open={publishOpen}
          onOpenChange={setPublishOpen}
          path={path}
          content={source}
          baseline={baseline}
          onLoadCurrent={handleLoadCurrent}
        />
      )}
    </main>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4" role="status" aria-label="Loading the lesson">
      <div className="h-28 animate-pulse border border-border bg-muted/40" />
      <div className="min-h-[400px] flex-1 animate-pulse border border-border bg-muted/40" />
    </div>
  )
}

interface FirstRunNoteProps {
  path: string
}

/**
 * Shown only until the first keystroke. A contributor arriving from the lesson page has no idea
 * where this file lives or what "publish" will do to their GitHub account, and finding that out at
 * the last dialog is where people stop.
 */
function FirstRunNote({ path }: FirstRunNoteProps) {
  return (
    <div className={quietNoticeClass}>
      <Text variant="caps-12" element="span" className="text-muted-foreground">
        Before you start
      </Text>
      <Text variant="main-14" className="text-muted-foreground">
        This is <span className="font-mono break-all">{path}</span> from {CONTENT_REPO_LABEL}, the open repository the
        site is built from. Edit it here, then publish: the file goes to GitHub, where it becomes a pull request for a
        maintainer to review. You will need a GitHub account for that last step — nothing before it.
      </Text>
      <Text variant="main-14" className="text-muted-foreground">
        Your work is saved in this browser as you type, so you can leave and come back.
      </Text>
    </div>
  )
}

interface ViolationListProps {
  violations: Array<{ line: number; message: string }>
  /** Lines the frontmatter occupies, which the buffer does not hold — see `goToLine`. */
  frontmatterLines: number
  onGoToLine: (line: number) => void
}

/**
 * `role="status"`, not `role="alert"`: this appears while somebody is mid-sentence, and an
 * assertive interruption on every keystroke would be worse than the mistake it reports.
 */
function ViolationList({ violations, frontmatterLines, onGoToLine }: ViolationListProps) {
  return (
    <div id={VIOLATIONS_ID} className={noticeClass} role="status">
      <Text variant="caps-12" element="span" className="flex items-center gap-2 text-primary">
        <AlertTriangle className="size-4" />
        {violations.length === 1 ? 'One thing to fix before publishing' : `${violations.length} things to fix`}
      </Text>
      <ul className="flex flex-col gap-2">
        {violations.map((violation) => (
          <li key={violation.message} className="flex flex-wrap items-baseline gap-2">
            {violation.line > frontmatterLines ? (
              <button
                type="button"
                onClick={() => onGoToLine(violation.line)}
                className={cn('cursor-pointer font-mono text-[13px] text-primary underline', focusRing)}
              >
                Go to line {violation.line}
              </button>
            ) : (
              <span className="font-mono text-[13px] text-muted-foreground">In the fields above</span>
            )}
            <Text variant="main-14" element="span" className="flex-1">
              {violation.message}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface ReadOnlyOnSmallScreenProps {
  path: string
  source: string
  title: string
}

/**
 * Not a dead end. Editing a Markdown buffer on a phone is genuinely bad — Android `contenteditable`
 * needs platform fixes and the split view has nowhere to go — but everything except the typing
 * still works, so the ways out are offered here rather than an apology.
 */
function ReadOnlyOnSmallScreen({ path, source, title }: ReadOnlyOnSmallScreenProps) {
  return (
    <>
      <div className={quietNoticeClass}>
        <Text variant="caps-12" element="span" className="text-muted-foreground">
          Read-only on this screen
        </Text>
        <Text variant="main-14" className="text-muted-foreground">
          The editor needs a keyboard and room for two columns, so on a phone this is the lesson as it stands. You can
          still take the file with you, or edit it directly on GitHub — that works on mobile.
        </Text>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className={cn('gap-2', focusRing)}>
            <a href={githubEditUrl(path)} target="_blank" rel="noopener noreferrer">
              Edit on GitHub
              <ExternalLink className="size-4" />
            </a>
          </Button>
          <CopyButton text={source} label="Copy the file" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn('gap-2', focusRing)}
            onClick={() => downloadMarkdown(path, source)}
          >
            <Download className="size-4" />
            Download .md
          </Button>
        </div>
      </div>
      <PreviewPane source={source} title={title} />
    </>
  )
}
