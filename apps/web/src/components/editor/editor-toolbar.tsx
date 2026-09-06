import { Fragment, useRef, useState } from 'react'
import { Bold, Code2, Heading2, Italic, Keyboard, Link2, List } from 'lucide-react'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { KeyboardEvent } from 'react'
import type { EditorView } from '@codemirror/view'
import type { Text } from '@codemirror/state'

/** The CodeMirror content element, so the toolbar can declare what it operates on. */
export const EDITOR_CONTENT_ID = 'lesson-markdown-body'

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
  'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40'

/** `⌘` on Apple hardware, `Ctrl` everywhere else — CodeMirror's `Mod-` binds to exactly this. */
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

interface ToolbarAction {
  label: string
  keys?: string
  icon: typeof Bold
  run: (view: EditorView) => boolean
  /** Starts a visual group. Groups become separators, which is most of what makes a toolbar read. */
  startsGroup?: boolean
}

const ACTIONS: ToolbarAction[] = [
  { label: 'Bold', keys: `${MOD}+B`, icon: Bold, run: (view) => toggleWrap(view, '**') },
  { label: 'Italic', keys: `${MOD}+I`, icon: Italic, run: (view) => toggleWrap(view, '*') },
  { label: 'Inline code', icon: Code2, run: (view) => toggleWrap(view, '`') },
  { label: 'Heading', keys: `${MOD}+Alt+2`, icon: Heading2, run: (view) => toggleHeading(view, 2), startsGroup: true },
  { label: 'Bulleted list', icon: List, run: (view) => toggleLinePrefix(view, '- ') },
  { label: 'Link', keys: `${MOD}+K`, icon: Link2, run: insertLink, startsGroup: true },
]

/** Everything the buffer responds to, including the bindings that have no button. */
const SHORTCUTS: Array<{ keys: string; what: string }> = [
  { keys: `${MOD}+B`, what: 'Bold' },
  { keys: `${MOD}+I`, what: 'Italic' },
  { keys: `${MOD}+K`, what: 'Link around the selection' },
  { keys: `${MOD}+Alt+1 … 3`, what: 'Heading level 1, 2 or 3' },
  { keys: 'Alt+↑ / Alt+↓', what: 'Move the current line up or down' },
  { keys: `${MOD}+Z / ${MOD}+Shift+Z`, what: 'Undo, redo' },
  { keys: `${MOD}+V`, what: 'Paste, formatted text arrives as Markdown' },
  { keys: 'Tab', what: 'Move focus out of the editor' },
]

export function EditorToolbar({ view, className }: EditorToolbarProps) {
  const [helpOpen, setHelpOpen] = useState(false)
  // Roving tabindex: a `role="toolbar"` is one stop in the tab order and is navigated with the
  // arrow keys, which also keeps six buttons from standing between the page and the editor.
  const [focused, setFocused] = useState(0)
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])

  // Wraps at both ends. `focused` follows from the button's own `onFocus`, so a disabled button
  // that refuses focus never becomes the toolbar's tab stop.
  const moveFocus = (to: number) => {
    buttonsRef.current[(to + ACTIONS.length + 1) % (ACTIONS.length + 1)]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    // Read the position from the focused element rather than from state: two arrow presses inside
    // one frame would otherwise both move from the same stale index.
    const at = buttonsRef.current.indexOf(document.activeElement as HTMLButtonElement)
    if (at === -1) return
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step !== 0) {
      event.preventDefault()
      moveFocus(at + step)
    } else if (event.key === 'Home') {
      event.preventDefault()
      moveFocus(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      moveFocus(ACTIONS.length)
    }
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label="Formatting"
        aria-controls={EDITOR_CONTENT_ID}
        onKeyDown={onKeyDown}
        className={cn('flex items-center gap-0.5 border-b border-border px-1 py-1', className)}
      >
        {ACTIONS.map(({ label, keys, icon: Icon, run, startsGroup }, index) => (
          <Fragment key={label}>
            {startsGroup && <span aria-hidden className="mx-1 h-5 w-px bg-border" />}
            <button
              ref={(node) => {
                buttonsRef.current[index] = node
              }}
              type="button"
              className={buttonClass}
              disabled={!view}
              tabIndex={index === focused ? 0 : -1}
              aria-label={keys ? `${label} (${keys})` : label}
              title={keys ? `${label} · ${keys}` : label}
              // Without this the button takes focus on press and the command runs against a selection
              // CodeMirror has already collapsed.
              onMouseDown={(event) => event.preventDefault()}
              onFocus={() => setFocused(index)}
              onClick={() => {
                if (!view) return
                run(view)
                view.focus()
              }}
            >
              <Icon className="size-4" />
            </button>
          </Fragment>
        ))}

        <button
          ref={(node) => {
            buttonsRef.current[ACTIONS.length] = node
          }}
          type="button"
          className={cn(buttonClass, 'ml-auto')}
          tabIndex={focused === ACTIONS.length ? 0 : -1}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
          onFocus={() => setFocused(ACTIONS.length)}
          onClick={() => setHelpOpen(true)}
        >
          <Keyboard className="size-4" />
        </button>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#000]">Keyboard shortcuts</DialogTitle>
            <DialogDescription className="text-[#000]/70">
              Markdown works too. The buffer is the file, exactly as it will be committed.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-3 pb-6">
            <dl className="flex flex-col gap-2">
              {SHORTCUTS.map(({ keys, what }) => (
                <div key={keys} className="flex items-baseline justify-between gap-4">
                  <dt className="font-mono text-[13px] whitespace-nowrap">{keys}</dt>
                  <dd className="text-right text-[14px] text-muted-foreground">{what}</dd>
                </div>
              ))}
            </dl>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}
