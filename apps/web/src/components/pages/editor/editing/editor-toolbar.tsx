import { Fragment, useRef, useState } from 'react'
import { Bold, Code2, FileDiff, Heading2, Italic, Link2, List, RotateCcw, Type } from 'lucide-react'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { KeyboardEvent, ReactNode } from 'react'
import type { EditorView } from '@codemirror/view'
import type { Text } from '@codemirror/state'

export const EDITOR_CONTENT_ID = 'lesson-markdown-body'

function runBefore(doc: Text, at: number, char: string): number {
  let length = 0
  while (at - length > 0 && doc.sliceString(at - length - 1, at - length) === char) length++
  return length
}

function runAfter(doc: Text, at: number, char: string): number {
  let length = 0
  while (at + length < doc.length && doc.sliceString(at + length, at + length + 1) === char) length++
  return length
}

export function toggleWrap(view: EditorView, marker: string): boolean {
  const { state } = view
  const range = state.selection.main
  const char = marker[0]
  const run = Math.min(runBefore(state.doc, range.from, char), runAfter(state.doc, range.to, char))

  // Unwrapping a single `*` from a `**` run would downgrade bold to italic instead of adding emphasis, so only unwrap a run that already carries this marker.
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

export function toggleLinePrefix(view: EditorView, prefix: string): boolean {
  const { state } = view
  const range = state.selection.main
  const first = state.doc.lineAt(range.from).number
  const end = range.to > range.from ? range.to - 1 : range.to
  const last = state.doc.lineAt(Math.max(range.from, end)).number

  const lines = []
  for (let number = first; number <= last; number++) lines.push(state.doc.line(number))

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
  view: EditorView | null
  dirty?: boolean
  onRevert?: () => void
  onShowChanges?: () => void
  className?: string
}

const buttonClass =
  'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40'

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

interface ToolbarAction {
  label: string
  keys?: string
  icon: typeof Bold
  run: (view: EditorView) => boolean
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

const SYNTAX: Array<{ syntax: string; what: ReactNode }> = [
  { syntax: '## Heading', what: 'Section heading. Use ### for a sub-section' },
  { syntax: '**bold**  *italic*', what: 'Emphasis' },
  { syntax: '`code`', what: 'Inline code' },
  {
    syntax: '```solidity',
    what: (
      <>
        Code block. Also <strong className="font-semibold">rust, typescript, or nothing</strong> for plain text
      </>
    ),
  },
  { syntax: '- item   1. item', what: 'Lists, and they nest' },
  { syntax: '> quote', what: 'Blockquote' },
  { syntax: '| a | b |', what: 'Table, GitHub flavoured' },
  { syntax: '[text](https://…)', what: 'Link' },
  { syntax: '[text](/courses/…)', what: 'Link to another lesson on this site' },
  { syntax: '<svg>…</svg>', what: 'Diagram, pasted as raw markup. Give it a <title>' },
]

export function EditorToolbar({ view, className, dirty, onRevert, onShowChanges }: EditorToolbarProps) {
  const trailing = [
    onShowChanges && { key: 'changes', label: 'Your changes', icon: FileDiff, run: onShowChanges, needsChange: true },
    onRevert && { key: 'revert', label: 'Undo every change', icon: RotateCcw, run: onRevert, needsChange: true },
    { key: 'syntax', label: 'What you can write', icon: Type, run: () => setHelpOpen(true), needsChange: false },
  ].filter((entry) => entry !== undefined)

  const [helpOpen, setHelpOpen] = useState(false)
  const [focused, setFocused] = useState(0)
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])

  const stops = ACTIONS.length + trailing.length
  const moveFocus = (to: number) => {
    buttonsRef.current[(to + stops) % stops]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
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
      moveFocus(stops - 1)
    }
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label="Formatting"
        aria-controls={EDITOR_CONTENT_ID}
        onKeyDown={onKeyDown}
        className={cn('flex flex-wrap items-center gap-0.5 border-b border-border px-1 py-1', className)}
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
              // Without this the button steals focus on click and the command runs against a selection CodeMirror already collapsed.
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

        <div className="ml-auto flex items-center gap-0.5">
          {trailing.map(({ key, label, icon: Icon, run, needsChange }, offset) => {
            const index = ACTIONS.length + offset
            return (
              <button
                key={key}
                ref={(node) => {
                  buttonsRef.current[index] = node
                }}
                type="button"
                className={buttonClass}
                disabled={needsChange && !dirty}
                tabIndex={focused === index ? 0 : -1}
                aria-label={label}
                title={label}
                onFocus={() => setFocused(index)}
                onClick={run}
              >
                <Icon className="size-4" />
              </button>
            )
          })}
        </div>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#000]">What you can write</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4 pb-6">
            <DialogDescription className="text-foreground text-[14px]">
              A lesson is Markdown. What you type is the file, exactly as it will be committed.
            </DialogDescription>
            <dl className="flex flex-col gap-2">
              {SYNTAX.map(({ syntax, what }) => (
                <div key={syntax} className="flex items-baseline justify-between gap-4">
                  <dt className="font-mono text-[13px] whitespace-nowrap">{syntax}</dt>
                  <dd className="text-right text-[14px] text-muted-foreground">{what}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[14px] text-muted-foreground">
              A paragraph that is only a link to plgrnd.io, eth.build or YouTube becomes an embedded frame.
            </p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}
