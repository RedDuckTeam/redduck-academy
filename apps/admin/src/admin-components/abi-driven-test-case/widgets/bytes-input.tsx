'use client'

import { WidgetShell } from './widget-shell'

interface BytesInputProps {
  label: string
  abiType: string
  value: string
  onChange: (next: string) => void
}

/** `bytes` / `bytesN` — 0x-prefixed hex; fixed-size types enforce exact length. */
export function BytesInput({ label, abiType, value, onChange }: BytesInputProps) {
  const error = validate(value, abiType)
  return (
    <WidgetShell label={label} description={hint(abiType)} error={error}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0x"
        spellCheck={false}
        style={inputStyle(error)}
      />
    </WidgetShell>
  )
}

function validate(raw: string, abiType: string): string | null {
  const v = raw.trim()
  if (v === '') return null
  if (!/^0x[a-fA-F0-9]*$/.test(v)) return 'Expected 0x-prefixed hex.'
  const fixed = abiType.match(/^bytes(\d+)$/)
  if (fixed) {
    const need = Number(fixed[1]) * 2
    if (v.length - 2 !== need) return `${abiType} requires exactly ${need} hex chars.`
  } else {
    if ((v.length - 2) % 2 !== 0) return 'Hex must have an even number of chars.'
  }
  return null
}

function hint(abiType: string): string {
  const fixed = abiType.match(/^bytes(\d+)$/)
  return fixed ? `Exactly ${Number(fixed[1]) * 2} hex chars after 0x.` : 'Variable-length hex.'
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
