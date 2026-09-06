import { Bold, Code2, Heading2, Italic, Link2, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorView } from '@codemirror/view'

// CodeMirror is only imported for its types here, so this file adds nothing to the bundle beyond
// itself — the commands work entirely through the view instance the editor hands over. A toolbar
// is the discoverable fallback GitBook, HackMD and Medium all keep for people who will never learn
// keyboard Markdown, so it is always visible rather than hidden behind a selection.

/** Wraps the selection in `marker`, or unwraps it when it is already wrapped. */
export function toggleWrap(view: EditorView, marker: string): boolean {
  const { state } = view
  const range = state.selection.main
  const before = state.doc.sliceString(Math.max(0, range.from - marker.length), range.from)
  const after = state.doc.sliceString(range.to, Math.min(state.doc.length, range.to + marker.length))

  if (before === marker && after === marker) {
    view.dispatch({
      changes: [
        { from: range.from - marker.length, to: range.from },
        { from: range.to, to: range.to + marker.length },
      ],
      selection: { anchor: range.from - marker.length, head: range.to - marker.length },
    })
    return true
  }

  const text = state.doc.sliceString(range.from, range.to)
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: `${marker}${text}${marker}` },
    selection: { anchor: range.from + marker.length, head: range.from + marker.length + text.length },
  })
  return true
}

export function toggleHeading(view: EditorView, level: number): boolean {
  const { state } = view
  const range = state.selection.main
  const line = state.doc.lineAt(range.from)
  const existing = /^#{1,6} /.exec(line.text)?.[0] ?? ''
  const marker = `${'#'.repeat(level)} `
  const insert = existing === marker ? '' : marker
  const shift = insert.length - existing.length

  view.dispatch({
    changes: { from: line.from, to: line.from + existing.length, insert },
    selection: { anchor: Math.max(line.from, range.anchor + shift), head: Math.max(line.from, range.head + shift) },
  })
  return true
}

/** Adds `prefix` to every selected line, or strips it when every line already has it. */
export function toggleLinePrefix(view: EditorView, prefix: string): boolean {
  const { state } = view
  const range = state.selection.main
  const first = state.doc.lineAt(range.from).number
  const last = state.doc.lineAt(range.to).number

  const lines = []
  for (let number = first; number <= last; number++) lines.push(state.doc.line(number))

  const allPrefixed = lines.every((line) => line.text.startsWith(prefix))
  const changes: Array<{ from: number; to?: number; insert?: string }> = []
  for (const line of lines) {
    if (allPrefixed) changes.push({ from: line.from, to: line.from + prefix.length })
    else if (!line.text.startsWith(prefix)) changes.push({ from: line.from, insert: prefix })
  }

  if (changes.length > 0) view.dispatch({ changes })
  return true
}

/** Inserts `[selection](url)` and selects `url`, so the destination can be typed straight over. */
export function insertLink(view: EditorView): boolean {
  const range = view.state.selection.main
  const text = view.state.doc.sliceString(range.from, range.to)
  const placeholder = 'url'
  const urlFrom = range.from + text.length + '[]('.length

  view.dispatch({
    changes: { from: range.from, to: range.to, insert: `[${text}](${placeholder})` },
    selection: { anchor: urlFrom, head: urlFrom + placeholder.length },
  })
  return true
}

interface EditorToolbarProps {
  /** Null until CodeMirror has mounted, which is one frame after this renders. */
  view: EditorView | null
  className?: string
}

const buttonClass =
  'inline-flex size-8 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40'

const ACTIONS = [
  { label: 'Bold', hint: 'Bold (Ctrl/Cmd+B)', icon: Bold, run: (view: EditorView) => toggleWrap(view, '**') },
  { label: 'Italic', hint: 'Italic (Ctrl/Cmd+I)', icon: Italic, run: (view: EditorView) => toggleWrap(view, '*') },
  { label: 'Link', hint: 'Link (Ctrl/Cmd+K)', icon: Link2, run: insertLink },
  { label: 'Heading', hint: 'Heading', icon: Heading2, run: (view: EditorView) => toggleHeading(view, 2) },
  { label: 'List', hint: 'Bulleted list', icon: List, run: (view: EditorView) => toggleLinePrefix(view, '- ') },
  { label: 'Code', hint: 'Inline code', icon: Code2, run: (view: EditorView) => toggleWrap(view, '`') },
]

export function EditorToolbar({ view, className }: EditorToolbarProps) {
  return (
    <div className={cn('flex items-center gap-0.5 border-b border-border px-1 py-1', className)}>
      {ACTIONS.map(({ label, hint, icon: Icon, run }) => (
        <button
          key={label}
          type="button"
          className={buttonClass}
          disabled={!view}
          aria-label={hint}
          title={hint}
          // Without this the button takes focus on press and the command runs against a selection
          // CodeMirror has already collapsed.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (!view) return
            run(view)
            view.focus()
          }}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  )
}
