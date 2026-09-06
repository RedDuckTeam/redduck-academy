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
  /** The prose below the frontmatter. The frontmatter block is edited by the form, never here. */
  value: string
  onChange: (value: string) => void
  /** Handed the live view so the page can put the cursor on a line a rule violation points at. */
  onViewReady?: (view: EditorView | null) => void
  className?: string
}

const stripWhitespace = (text: string) => text.replace(/\s+/g, '')

const CODE_NODES = new Set(['FencedCode', 'CodeBlock', 'InlineCode'])

/** True for a lone http(s) URL — the shape that should become a link around the selection. */
function isSingleUrl(text: string): boolean {
  if (!text || /\s/.test(text)) return false
  try {
    const url = new URL(text)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** True inside a fenced block, an indented block or inline code, where Markdown means nothing. */
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

  // Inside a code block every rewrite below is wrong, and one of them is destructive: a converted
  // ``` fence pasted into an open fence closes it, and the rest of the lesson stops being code.
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

  // Copying inside CodeMirror, or out of any plain-text editor, puts no `text/html` on the
  // clipboard — so this branch only ever runs on a paste from rendered content.
  const html = clipboard.getData('text/html')
  if (!html) return false

  const converted = htmlToMarkdown(html)
  // Whitespace-blind, not just an equality check: an IDE writes syntax-highlighted HTML with one
  // <div> per line, which converts to the same characters with every level of indentation gone and
  // a blank line between them. When the conversion adds no Markdown of its own, the plain flavour
  // is the faithful one.
  if (!converted || stripWhitespace(converted) === stripWhitespace(plain)) return false

  event.preventDefault()
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: converted },
    selection: { anchor: range.from + converted.length },
  })
  return true
}

const editorTheme = EditorView.theme({
  // A definite height is what makes `.cm-scroller` the scrolling element, and that is what lets
  // CodeMirror render only the visible lines. Scrolled by an ancestor instead, it puts the whole
  // document in the DOM — 11,000 pixels of it on the longest lesson here.
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

export function MarkdownEditor({ value, onChange, onViewReady, className }: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<EditorView | null>(null)

  // Read through refs so the editor is constructed once: rebuilding the state on each keystroke
  // would throw away undo history and the cursor.
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
          // Above the defaults so Mod-K reaches the link command rather than a built-in binding.
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
          // `defaultKeymap` is also where Alt-ArrowUp/Down come from: line moves are the reordering
          // gesture a source-of-truth buffer wants, and they work from the keyboard alone — unlike
          // drag handles, which fail WCAG 2.2 SC 2.5.7 when they are the only way to reorder.
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown({ base: markdownLanguage }),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          EditorView.lineWrapping,
          livePreview(),
          editorTheme,
          // CodeMirror's content element is a bare `contenteditable`; without these a screen reader
          // announces an unlabelled edit box, and the toolbar's `aria-controls` points at nothing.
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

  // Only fires when the buffer is replaced from outside — restoring a draft, or loading the merged
  // lesson after a 409. Ordinary typing round-trips to the identical string and is skipped.
  useEffect(() => {
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
  }, [view, value])

  return (
    // CodeMirror clears its own focus ring (`&.cm-focused { outline: none }`) because the ring
    // belongs on the framed editor, not on the scroller inside it.
    <div className={cn('flex min-h-0 flex-col border border-border has-[.cm-focused]:border-foreground', className)}>
      <EditorToolbar view={view} />
      <div ref={hostRef} className="min-h-0 flex-1" />
    </div>
  )
}
