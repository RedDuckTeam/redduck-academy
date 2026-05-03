'use client'

import { WidgetShell } from './widget-shell'

interface StringInputProps {
  label: string
  value: string
  onChange: (next: string) => void
}

/** `string` — plain text, no quotes required. */
export function StringInput({ label, value, onChange }: StringInputProps) {
  return (
    <WidgetShell label={label} description="Plain text — no quotes needed.">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="hello world"
        style={{
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--theme-elevation-200, #ccc)',
          borderRadius: '4px',
          background: 'var(--theme-input-bg, #fff)',
          color: 'var(--theme-elevation-900, #111)',
        }}
      />
    </WidgetShell>
  )
}
