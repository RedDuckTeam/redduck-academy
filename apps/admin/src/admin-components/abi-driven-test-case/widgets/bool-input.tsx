'use client'

import { WidgetShell } from './widget-shell'

interface BoolInputProps {
  label: string
  value: string
  onChange: (next: string) => void
}

/** `bool` — checkbox stored as `'true'` / `'false'`. */
export function BoolInput({ label, value, onChange }: BoolInputProps) {
  const checked = value.trim().toLowerCase() === 'true'
  return (
    <WidgetShell label={label}>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
        />
        <span>{checked ? 'true' : 'false'}</span>
      </label>
    </WidgetShell>
  )
}
