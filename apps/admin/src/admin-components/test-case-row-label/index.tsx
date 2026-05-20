'use client'

import type { MouseEvent } from 'react'
import { useField, useRowLabel } from '@payloadcms/ui'

type RowData = { name?: string | null }

function makeRowLabel(prefix: string) {
  return function RowLabel() {
    const { data, path, rowNumber } = useRowLabel<RowData>()
    const { value, setValue } = useField<string>({ path: `${path}.name` })

    const fallback = `${prefix} ${(rowNumber ?? 0) + 1}`
    const current = ((typeof value === 'string' ? value : data?.name) ?? '').trim()

    const handleRename = (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const next = window.prompt(`Rename ${fallback}`, current)
      if (next === null) return
      setValue(next.trim() || null)
    }

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>{current ? `${fallback} — ${current}` : fallback}</span>
        <button
          type="button"
          onClick={handleRename}
          title="Rename"
          aria-label={`Rename ${fallback}`}
          style={{
            background: 'transparent',
            border: 0,
            padding: '0 0.25rem',
            cursor: 'pointer',
            color: 'inherit',
            fontSize: '0.9em',
            lineHeight: 1,
            opacity: 0.7,
            pointerEvents: 'auto',
          }}
        >
          ✎
        </button>
      </span>
    )
  }
}

export const TestCaseRowLabel = makeRowLabel('Case')
export const StepRowLabel = makeRowLabel('Step')
