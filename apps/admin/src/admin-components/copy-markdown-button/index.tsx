'use client'

import type { SerializedEditorState } from 'lexical'
import { useState, useTransition } from 'react'
import { useField } from '@payloadcms/ui'

import { lexicalToMarkdownAction, markdownToLexicalAction } from './action'

type Status = 'idle' | 'copied' | 'pasted' | 'error'

export function CopyMarkdownButton() {
  const { value, setValue } = useField<SerializedEditorState | null>({ path: 'content' })
  const [pendingCopy, startCopy] = useTransition()
  const [pendingPaste, startPaste] = useTransition()
  const [status, setStatus] = useState<Status>('idle')

  const handleCopy = () => {
    setStatus('idle')
    startCopy(async () => {
      try {
        const markdown = await lexicalToMarkdownAction(value ?? null)
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
        if (
          value &&
          !window.confirm('Replace current lesson content with markdown from clipboard?')
        ) {
          return
        }
        const next = await markdownToLexicalAction(markdown)
        setValue(next)
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
