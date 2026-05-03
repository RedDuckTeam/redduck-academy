'use client'

import { WidgetShell } from './widget-shell'

interface AddressInputProps {
  label: string
  value: string
  onChange: (next: string) => void
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

/** `address` — 0x-prefixed 20-byte hex. */
export function AddressInput({ label, value, onChange }: AddressInputProps) {
  const error = value.trim() === '' || ADDRESS_RE.test(value.trim()) ? null : 'Expected 0x + 40 hex chars.'
  return (
    <WidgetShell label={label} description="20-byte hex address." error={error}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0x0000000000000000000000000000000000000000"
        spellCheck={false}
        style={inputStyle(error)}
      />
    </WidgetShell>
  )
}

function inputStyle(error: string | null) {
  return {
    padding: '0.5rem 0.75rem',
    fontFamily: 'var(--font-mono, monospace)',
    border: `1px solid var(${error ? '--theme-error-500' : '--theme-elevation-200'}, #ccc)`,
    borderRadius: '4px',
    background: 'var(--theme-input-bg, #fff)',
    color: 'var(--theme-elevation-900, #111)',
  } as const
}
