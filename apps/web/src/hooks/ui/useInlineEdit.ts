import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const NO_OVERRIDE = Symbol('no-override')

export interface UseInlineEditConfig<T> {
  value: T
  onSave: (next: T) => Promise<void> | void
  /** Convert the trimmed draft string into the saved value type. */
  parse?: (trimmed: string) => T
  /** Return an error message string to abort the save, or null/undefined to allow it. */
  validate?: (trimmed: string) => string | null | undefined
  /** Sanitizer run on every keystroke (e.g. regex filter). */
  transform?: (raw: string) => string
  /** Place caret at end after entering edit mode. */
  focusCursorAtEnd?: boolean
  /** Press Enter to commit (single-line inputs). */
  commitOnEnter?: boolean
  /** Press Escape to discard the draft. */
  discardOnEscape?: boolean
  /** Fallback toast when onSave throws a non-Error. */
  saveErrorMessage?: string
}

const defaultParse = <T,>(trimmed: string): T => trimmed as unknown as T

export function useInlineEdit<T = string>({
  value,
  onSave,
  parse = defaultParse,
  validate,
  transform,
  focusCursorAtEnd = false,
  commitOnEnter = false,
  discardOnEscape = false,
  saveErrorMessage = 'Failed to save',
}: UseInlineEditConfig<T>) {
  const [override, setOverride] = useState<T | typeof NO_OVERRIDE>(NO_OVERRIDE)
  const displayValue = override === NO_OVERRIDE ? value : override

  const stringify = (v: T): string => (v == null ? '' : String(v))

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<string>(stringify(displayValue))

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const actionButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isEditing) return
    const el = inputRef.current
    if (!el) return
    el.focus()
    if (focusCursorAtEnd) el.setSelectionRange(el.value.length, el.value.length)
  }, [isEditing, focusCursorAtEnd])

  const startEdit = useCallback(() => {
    setDraft(stringify(displayValue))
    setIsEditing(true)
  }, [displayValue])

  const discardEdit = useCallback(() => {
    setIsEditing(false)
  }, [])

  const commit = useCallback(async () => {
    if (!isEditing) return

    const trimmed = draft.trim()

    const error = validate?.(trimmed)
    if (error) {
      toast.error(error)
      setIsEditing(false)
      return
    }

    const next = parse(trimmed)

    if (next === displayValue) {
      setIsEditing(false)
      return
    }

    setIsEditing(false)
    setOverride(next)

    try {
      await onSave(next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : saveErrorMessage)
    } finally {
      setOverride(NO_OVERRIDE)
    }
  }, [isEditing, draft, displayValue, validate, parse, onSave, saveErrorMessage])

  useEffect(() => {
    if (!isEditing) return

    const onPointerDown = (e: PointerEvent) => {
      const el = inputRef.current
      if (!el || el.contains(e.target as Node)) return
      if (actionButtonRef.current?.contains(e.target as Node)) return
      void commit()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [isEditing, commit])

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const raw = e.target.value
      setDraft(transform ? transform(raw) : raw)
    },
    [transform],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (commitOnEnter && e.key === 'Enter') {
        e.preventDefault()
        void commit()
      } else if (discardOnEscape && e.key === 'Escape') {
        e.preventDefault()
        discardEdit()
      }
    },
    [commitOnEnter, discardOnEscape, commit, discardEdit],
  )

  return {
    isEditing,
    draft,
    setDraft,
    displayValue,
    startEdit,
    discardEdit,
    commit,
    inputRef,
    actionButtonRef,
    inputHandlers: { onChange, onKeyDown },
  }
}
