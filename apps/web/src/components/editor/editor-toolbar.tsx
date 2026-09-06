import { Bold, Code2, Heading2, Italic, Link2, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorView } from '@codemirror/view'
import type { Text } from '@codemirror/state'

// CodeMirror is only imported for its types here, so this file adds nothing to the bundle beyond
// itself — the commands work entirely through the view instance the editor hands over. A toolbar
// is the discoverable fallback GitBook, HackMD and Medium all keep for people who will never learn
// keyboard Markdown, so it is always visible rather than hidden behind a selection.

/** How many `char` in a row end at `at`, looking backwards. */
function runBefore(doc: Text, at: number, char: string): number {
  let length = 0
  while (at - length > 0 && doc.sliceString(at - length - 1, at - length) === char) length++
  return length
}

/** How many `char` in a row start at `at`. */
function runAfter(doc: Text, at: number, char: string): number {
  let length = 0
  while (at + length < doc.length && doc.sliceString(at + length, at + length + 1) === char) length++
  return length
}

/** Wraps the selection in `marker`, or unwraps it when it is already wrapped. */
export function toggleWrap(view: EditorView, marker: string): boolean {
  const { state } = view
  const range = state.selection.main
  const char = marker[0]
  const run = Math.min(runBefore(state.doc, range.from, char), runAfter(state.doc, range.to, char))

  // A run of asterisks is one delimiter: `*` is italic, `**` bold, `***` both. Taking a single `*`
  // out of a `**` run would downgrade bold to italic rather than adding emphasis — which is what
  // pressing Italic on bold text used to do — so unwrap only a run that carries this marker.
  const wrapped = char === '*' ? run === marker.length || run === 3 : run >= marker.length

  if (wrapped) {
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
  // A drag-selection normally ends on the first character of the line after the last one the
  // contributor meant to include, and bulleting that line adds an empty bullet to the diff.
  const end = range.to > range.from ? range.to - 1 : range.to
  const last = state.doc.lineAt(Math.max(range.from, end)).number

  const lines = []
  for (let number = first; number <= last; number++) lines.push(state.doc.line(number))

  // Measured against the first non-blank column, so an already-indented `  - item` counts as
  // prefixed instead of picking up a second bullet at column 0.
  const indent = (line: { text: string }) => line.text.length - line.text.trimStart().length
  const allPrefixed = lines.every((line) => line.text.trimStart().startsWith(prefix))
  const changes: Array<{ from: number; to?: number; insert?: string }> = []
  for (const line of lines) {
    const at = line.from + indent(line)
    if (allPrefixed) changes.push({ from: at, to: at + prefix.length })
    else if (!line.text.trimStart().startsWith(prefix)) changes.push({ from: at, insert: prefix })
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
