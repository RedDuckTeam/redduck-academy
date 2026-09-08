import { Fragment, useRef, useState } from 'react'
import { Bold, Code2, FileDiff, Heading2, Italic, Link2, List, RotateCcw, Type } from 'lucide-react'
import { insertLink, toggleHeading, toggleLinePrefix, toggleWrap } from './markdown-commands'
import { SyntaxHelpDialog } from './syntax-help-dialog'
import { cn } from '@/lib/utils'
import type { KeyboardEvent } from 'react'
import type { EditorView } from '@codemirror/view'

export const EDITOR_CONTENT_ID = 'lesson-markdown-body'

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

export function EditorToolbar({ view, className, dirty, onRevert, onShowChanges }: EditorToolbarProps) {
  const [helpOpen, setHelpOpen] = useState(false)
  const [focused, setFocused] = useState(0)
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])

  const trailing = [
    onShowChanges && { key: 'changes', label: 'Your changes', icon: FileDiff, run: onShowChanges, needsChange: true },
    onRevert && { key: 'revert', label: 'Undo every change', icon: RotateCcw, run: onRevert, needsChange: true },
    { key: 'syntax', label: 'What you can write', icon: Type, run: () => setHelpOpen(true), needsChange: false },
  ].filter((entry) => entry !== undefined)

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
              aria-label={keys ? `${label}, ${keys}` : label}
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

      <SyntaxHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  )
}
