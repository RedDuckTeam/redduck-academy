'use client'

import type { SerializedEditorState } from 'lexical'
import { useState, useTransition } from 'react'
import { useField } from '@payloadcms/ui'

type Status = 'idle' | 'copied' | 'pasted' | 'error'

async function fromLexical(data: SerializedEditorState | null): Promise<string> {
  if (!data) return ''
  const res = await fetch('/api/lessons/markdown/from-lexical', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const { markdown } = (await res.json()) as { markdown: string }
  return markdown
}

async function toLexical(markdown: string): Promise<SerializedEditorState> {
  const res = await fetch('/api/lessons/markdown/to-lexical', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as SerializedEditorState
}

export function CopyMarkdownButton() {
  const { value, setValue } = useField<SerializedEditorState | null>({ path: 'content' })
  const [pendingCopy, startCopy] = useTransition()
  const [pendingPaste, startPaste] = useTransition()
  const [status, setStatus] = useState<Status>('idle')

  const handleCopy = () => {
    setStatus('idle')
    startCopy(async () => {
      try {
        const markdown = await fromLexical(value ?? null)
        await navigator.clipboard.writeText(markdown)
        setStatus('copied')
        setTimeout(() => setStatus('idle'), 1500)
      } catch {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 2500)
      }
    })
  }

  const handlePaste = () => {
    setStatus('idle')
    startPaste(async () => {
      try {
        const markdown = await navigator.clipboard.readText()
        if (!markdown.trim()) {
          setStatus('error')
          setTimeout(() => setStatus('idle'), 2500)
          return
        }
        const parsed = await toLexical(markdown)
        const incomingChildren = (parsed?.root?.children ?? []) as unknown[]
        const currentChildren = (value?.root?.children ?? []) as unknown[]
        const merged: SerializedEditorState = {
          ...(value ?? parsed),
          root: {
            ...(value?.root ?? parsed.root),
            children: [...currentChildren, ...incomingChildren],
          },
        } as SerializedEditorState
        setValue(merged)
        setStatus('pasted')
        setTimeout(() => setStatus('idle'), 1500)
      } catch {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 2500)
      }
    })
  }

  const copyLabel = pendingCopy
    ? 'Copying…'
    : status === 'copied'
      ? 'Copied!'
      : status === 'error'
        ? 'Failed'
        : 'Copy Markdown'

  const pasteLabel = pendingPaste
    ? 'Pasting…'
    : status === 'pasted'
      ? 'Pasted!'
      : status === 'error'
        ? 'Failed'
        : 'Paste Markdown'

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        type="button"
        className="btn btn--style-primary btn--size-medium"
        onClick={handleCopy}
        disabled={pendingCopy || pendingPaste}
      >
        {copyLabel}
      </button>
      <button
        type="button"
        className="btn btn--style-primary btn--size-medium"
        onClick={handlePaste}
        disabled={pendingCopy || pendingPaste}
      >
        {pasteLabel}
      </button>
    </div>
  )
}
