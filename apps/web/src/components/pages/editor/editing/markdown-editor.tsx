import { useEffect, useRef, useState } from 'react'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { defaultHighlightStyle, syntaxHighlighting, syntaxTree } from '@codemirror/language'
import { EditorState, Prec } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import type { SyntaxNode } from '@lezer/common'
import { EDITOR_CONTENT_ID, EditorToolbar, insertLink, toggleHeading, toggleWrap } from './editor-toolbar'
import { livePreview } from './live-preview'
import { htmlToMarkdown } from '@/lib/editor/html-to-markdown'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onViewReady?: (view: EditorView | null) => void
  dirty?: boolean
  onRevert?: () => void
  onShowChanges?: () => void
  className?: string
}

const stripWhitespace = (text: string) => text.replace(/\s+/g, '')

const CODE_NODES = new Set(['FencedCode', 'CodeBlock', 'InlineCode'])

function isSingleUrl(text: string): boolean {
  if (!text || /\s/.test(text)) return false
  try {
    const url = new URL(text)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function inCode(view: EditorView, at: number): boolean {
  let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(at, -1)
  while (node) {
    if (CODE_NODES.has(node.name)) return true
    node = node.parent
  }
  return false
}

function handlePaste(event: ClipboardEvent, view: EditorView): boolean {
  const clipboard = event.clipboardData
  if (!clipboard) return false

  const range = view.state.selection.main
  const plain = clipboard.getData('text/plain').trim()

  if (inCode(view, range.from)) return false

  if (!range.empty && isSingleUrl(plain)) {
    const selected = view.state.doc.sliceString(range.from, range.to)
    const link = `[${selected}](${plain})`
    event.preventDefault()
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: link },
      selection: { anchor: range.from + link.length },
    })
    return true
  }

  const html = clipboard.getData('text/html')
  if (!html) return false

  const converted = htmlToMarkdown(html)
  // Whitespace-blind fallback: if converting only changes whitespace, it added no real Markdown, so use the plain-text paste instead.
  if (!converted || stripWhitespace(converted) === stripWhitespace(plain)) return false

  event.preventDefault()
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: converted },
    selection: { anchor: range.from + converted.length },
  })
  return true
}

const editorTheme = EditorView.theme({
  // A definite height makes `.cm-scroller` the scrolling element, so CodeMirror renders only visible lines instead of the whole document.
  '&': { height: '100%', color: 'var(--foreground)', backgroundColor: 'transparent', fontSize: '16px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'inherit', lineHeight: '1.6', overflow: 'auto' },
  '.cm-content': { padding: '16px 20px', caretColor: 'var(--foreground)' },
  '.cm-line': { padding: '0' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 25%, transparent)',
  },
})

export function MarkdownEditor({
  value,
  onChange,
  onViewReady,
  className,
  dirty,
  onRevert,
  onShowChanges,
}: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<EditorView | null>(null)

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onViewReadyRef = useRef(onViewReady)
  onViewReadyRef.current = onViewReady
  const initialDoc = useRef(value)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const instance = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: initialDoc.current,
        extensions: [
          history(),
          Prec.high(
            keymap.of([
              { key: 'Mod-b', run: (target) => toggleWrap(target, '**') },
              { key: 'Mod-i', run: (target) => toggleWrap(target, '*') },
              { key: 'Mod-k', run: insertLink },
              { key: 'Mod-Alt-1', run: (target) => toggleHeading(target, 1) },
              { key: 'Mod-Alt-2', run: (target) => toggleHeading(target, 2) },
              { key: 'Mod-Alt-3', run: (target) => toggleHeading(target, 3) },
            ]),
          ),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown({ base: markdownLanguage }),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          EditorView.lineWrapping,
          livePreview(),
          editorTheme,
          EditorView.contentAttributes.of({
            id: EDITOR_CONTENT_ID,
            'aria-label': 'Lesson body, Markdown',
          }),
          EditorView.domEventHandlers({ paste: handlePaste }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString())
          }),
        ],
      }),
    })

    setView(instance)
    onViewReadyRef.current?.(instance)
    return () => {
      instance.destroy()
      setView(null)
      onViewReadyRef.current?.(null)
    }
  }, [])

  useEffect(() => {
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
  }, [view, value])

  return (
    <div className={cn('flex min-h-0 flex-col border border-border has-[.cm-focused]:border-foreground', className)}>
      <EditorToolbar view={view} dirty={dirty} onRevert={onRevert} onShowChanges={onShowChanges} />
      <div ref={hostRef} className="min-h-0 flex-1" />
    </div>
  )
}
