'use client'

import { WidgetShell } from './widget-shell'

interface IntInputProps {
  label: string
  abiType: string
  value: string
  onChange: (next: string) => void
}

/**
 * Numeric text input for `int*` types — same as UintInput but signed and bounded
 * symmetrically around zero.
 */
export function IntInput({ label, abiType, value, onChange }: IntInputProps) {
  const error = validate(value, abiType)
  return (
    <WidgetShell label={label} description="Decimal or 0x-hex; signed." error={error}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        style={inputStyle(error)}
      />
    </WidgetShell>
  )
}

function validate(raw: string, abiType: string): string | null {
  if (raw.trim() === '') return null
  let v: bigint
  try {
    v = BigInt(raw.trim())
  } catch {
    return `Invalid ${abiType}.`
  }
  const bitsMatch = abiType.match(/^int(\d*)$/)
  const bits = bitsMatch && bitsMatch[1] ? Number(bitsMatch[1]) : 256
  const max = (1n << BigInt(bits - 1)) - 1n
  const min = -(1n << BigInt(bits - 1))
  if (v < min) return `Value below ${abiType} min (${min.toString()}).`
  if (v > max) return `Value exceeds ${abiType} max (${max.toString()}).`
  return null
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
