import { useEffect, useRef, useState } from 'react'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorState, Prec } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { EditorToolbar, insertLink, toggleHeading, toggleWrap } from './editor-toolbar'
import { livePreview } from './live-preview'
import { htmlToMarkdown } from '@/lib/editor/html-to-markdown'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  /** The prose below the frontmatter. The frontmatter block is edited by the form, never here. */
  value: string
  onChange: (value: string) => void
  className?: string
}

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

function handlePaste(event: ClipboardEvent, view: EditorView): boolean {
  const clipboard = event.clipboardData
  if (!clipboard) return false

  const range = view.state.selection.main
  const plain = clipboard.getData('text/plain').trim()

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
  if (!converted || converted === plain) return false

  event.preventDefault()
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: converted },
    selection: { anchor: range.from + converted.length },
  })
  return true
}

const editorTheme = EditorView.theme({
  '&': { color: 'var(--foreground)', backgroundColor: 'transparent', fontSize: '16px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'inherit', lineHeight: '1.6' },
  '.cm-content': { padding: '16px 20px', caretColor: 'var(--foreground)' },
  '.cm-line': { padding: '0' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 25%, transparent)',
  },
})

export function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<EditorView | null>(null)

  // Read through refs so the editor is constructed once: rebuilding the state on each keystroke
  // would throw away undo history and the cursor.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
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
          EditorView.domEventHandlers({ paste: handlePaste }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString())
          }),
        ],
      }),
    })

    setView(instance)
    return () => {
      instance.destroy()
      setView(null)
    }
  }, [])

  // Only fires when the buffer is replaced from outside — restoring a draft, or keeping your own
  // text after a 409. Ordinary typing round-trips to the identical string and is skipped.
  useEffect(() => {
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
  }, [view, value])

  return (
    <div className={cn('flex min-h-0 flex-col border border-border', className)}>
      <EditorToolbar view={view} />
      <div ref={hostRef} className="min-h-0 flex-1 overflow-auto" />
    </div>
  )
}
