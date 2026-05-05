'use client'

import type { SerializedEditorState } from 'lexical'
import { useState, useTransition } from 'react'
import { useField } from '@payloadcms/ui'

import { lexicalToMarkdownAction } from './action'

export function CopyMarkdownButton() {
  const { value } = useField<SerializedEditorState | null>({ path: 'content' })
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const handleClick = () => {
    setStatus('idle')
    startTransition(async () => {
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

  const label = status === 'copied' ? 'Copied!' : status === 'error' ? 'Failed' : 'Copy Markdown'

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={handleClick} disabled={pending}>
        {pending ? 'Copying…' : label}
      </button>
    </div>
  )
}
