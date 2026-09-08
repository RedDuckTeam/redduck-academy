import { Suspense, lazy, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from '@/components/ui/icons/arrow-right'
import { Text } from '@/components/ui/text'
import { DraftBanner } from './draft-banner'
import { FrontmatterForm } from './frontmatter-form'
import { HowItWorksDialog } from './how-it-works-dialog'
import { PreviewPane } from './preview-pane'
import { ViewModeTabs } from './view-mode-tabs'
import { VIOLATIONS_ID, ViolationList } from './violation-list'
import { ChangesDialog } from './changes/changes-dialog'
import { PublishDialog } from './publish/publish-dialog'
import { useGoToLine } from '@/hooks/editor/useGoToLine'
import { useLessonDraft } from '@/hooks/editor/useLessonDraft'
import { useLessonSource } from '@/hooks/editor/useLessonSource'
import { useMediaQuery } from '@/hooks/ui/useMediaQuery'
import { checkContentRules } from '@/lib/editor/content-rules'
import { draftKey } from '@/lib/editor/draft-store'
import { readFrontmatter } from '@/lib/editor/lesson-frontmatter'
import { githubEditUrl, lessonFilePath } from '@/lib/editor/github-publish'
import { splitSource } from '@/lib/editor/lesson-source'
import { focusRing, noticeClass } from '@/lib/editor/styles'
import { cn } from '@/lib/utils'
import type { ViewMode } from './view-mode-tabs'
import type { EditorView } from '@codemirror/view'

// Lazy: CodeMirror and its Markdown grammar are ~171 KB gzipped, which would push the app past the
// Worker's bundle-size limit if imported eagerly.
const MarkdownEditor = lazy(() =>
  import('./editing/markdown-editor').then((module) => ({ default: module.MarkdownEditor })),
)

const SPLIT_QUERY = '(min-width: 1024px)'
const columnClass = 'flex min-h-0 min-w-0 flex-col gap-4'
const paneHeight = 'lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)]'
const pageClass = 'mx-5 mb-[60px] flex min-h-screen flex-col gap-4 pt-6 lg:mx-[60px]'

interface BackToLessonProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}

function BackToLesson({ courseSlug, moduleSlug, lessonSlug }: BackToLessonProps) {
  return (
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
  )
}

interface LessonEditorProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
}

export function LessonEditor({ courseSlug, moduleSlug, lessonSlug }: LessonEditorProps) {
  const canSplit = useMediaQuery(SPLIT_QUERY)
  const path = lessonFilePath(courseSlug, moduleSlug, lessonSlug)

  const published = useLessonSource(courseSlug, moduleSlug, lessonSlug)
  const [edited, setEdited] = useState<{ source: string; baseline: string } | null>(null)
  const [mode, setMode] = useState<ViewMode>('split')
  const [publishOpen, setPublishOpen] = useState(false)
  const [changesOpen, setChangesOpen] = useState(false)
  const viewRef = useRef<EditorView | null>(null)

  const source = edited?.source ?? published.data ?? ''
  const baseline = edited?.baseline ?? published.data ?? ''

  const draft = useLessonDraft({
    key: draftKey(courseSlug, moduleSlug, lessonSlug),
    published: published.data,
    source,
    baseline,
    onRestore: (stored) => setEdited({ source: stored.content, baseline: stored.baseline }),
  })

  const setSource = (next: string) => setEdited({ source: next, baseline })

  const effectiveMode = canSplit ? mode : mode === 'split' ? 'write' : mode
  const { frontmatter, body } = splitSource(source)

  const violations = useMemo(
    () => (published.data === undefined ? [] : checkContentRules(source)),
    [published.data, source],
  )

  const jumpToLine = useGoToLine({ view: viewRef, editorVisible: effectiveMode !== 'preview' })
  const goToLine = (line: number) => {
    if (effectiveMode === 'preview') setMode('write')
    jumpToLine(line)
  }

  // The lesson page hides its edit link for tests; this catches the same file opened by its URL.
  if (published.data !== undefined && readFrontmatter(published.data)?.type === 'test') {
    return (
      <main className={pageClass}>
        <div className={cn(noticeClass, 'items-start')}>
          <Text variant="caps-12" element="span" className="flex items-center gap-2 text-primary">
            <AlertTriangle className="size-4" />
            Tests are edited on GitHub
          </Text>
          <Text variant="main-18">
            The questions in a test lesson are written in a format this editor does not understand yet, and an edit that
            breaks one of them deletes the answers learners have already saved.
          </Text>
          <Button asChild variant="outline" size="sm" className={cn('gap-2', focusRing)}>
            <a href={githubEditUrl(path)} target="_blank" rel="noopener noreferrer">
              Edit it on GitHub
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
        <BackToLesson courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
      </main>
    )
  }

  return (
    <main className={pageClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full flex-wrap items-center gap-4 sm:w-auto">
          {published.isSuccess && <ViewModeTabs mode={effectiveMode} onModeChange={setMode} canSplit={canSplit} />}
          <HowItWorksDialog path={path} />
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <Button
            type="button"
            size="sm"
            className={cn('w-full sm:w-auto', focusRing)}
            disabled={!draft.isDirty || violations.length > 0}
            aria-describedby={violations.length > 0 ? VIOLATIONS_ID : undefined}
            onClick={() => setPublishOpen(true)}
          >
            Publish on GitHub
          </Button>
        </div>
      </div>

      {published.isPending && (
        <div className="flex flex-1 flex-col gap-4" role="status" aria-label="Loading the lesson">
          <div className="h-28 animate-pulse border border-border bg-muted/40" />
          <div className="min-h-[400px] flex-1 animate-pulse border border-border bg-muted/40" />
        </div>
      )}

      {published.isError && (
        <div className={cn(noticeClass, 'items-start')} role="alert">
          <Text variant="caps-12" element="span" className="flex items-center gap-2 text-primary">
            <AlertTriangle className="size-4" />
            This lesson could not be opened
          </Text>
          <Text variant="main-18">{published.error.message}</Text>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className={focusRing} onClick={() => published.refetch()}>
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

      {draft.offer && <DraftBanner savedAt={draft.offer.savedAt} onRestore={draft.restore} onDiscard={draft.discard} />}

      {violations.length > 0 && <ViolationList violations={violations} onGoToLine={goToLine} />}

      {published.isSuccess && (
        <div className={cn('grid min-h-0 flex-1 gap-6 lg:items-start', effectiveMode === 'split' && 'lg:grid-cols-2')}>
          <div className={cn(columnClass, paneHeight, 'lg:overflow-y-auto', effectiveMode === 'preview' && 'hidden')}>
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
                dirty={draft.isDirty}
                onRevert={() => setSource(baseline)}
                onShowChanges={() => setChangesOpen(true)}
                onViewReady={(view) => {
                  viewRef.current = view
                }}
                className="min-h-[400px] flex-1"
              />
            </Suspense>
          </div>

          {effectiveMode !== 'write' && (
            <div className={cn(columnClass, paneHeight, 'overflow-x-hidden overflow-y-auto lg:pr-1')}>
              <PreviewPane source={source} lessonSlug={lessonSlug} />
            </div>
          )}
        </div>
      )}

      <BackToLesson courseSlug={courseSlug} moduleSlug={moduleSlug} lessonSlug={lessonSlug} />

      {changesOpen && (
        <ChangesDialog open={changesOpen} onOpenChange={setChangesOpen} baseline={baseline} source={source} />
      )}

      {publishOpen && <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} path={path} content={source} />}
    </main>
  )
}
