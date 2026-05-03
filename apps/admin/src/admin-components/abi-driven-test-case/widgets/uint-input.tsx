'use client'

import { WidgetShell } from './widget-shell'

interface UintInputProps {
  label: string
  abiType: string
  value: string
  onChange: (next: string) => void
}

/**
 * Numeric text input for `uint*` types. Accepts decimal or `0x...` hex; validates as
 * non-negative BigInt and warns on out-of-range values for the bitwidth.
 */
export function UintInput({ label, abiType, value, onChange }: UintInputProps) {
  const error = validate(value, abiType)
  return (
    <WidgetShell label={label} description={`Decimal or 0x-hex. Stored as canonical decimal string.`} error={error}>
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
    return `Invalid ${abiType} (expected non-negative integer).`
  }
  if (v < 0n) return `${abiType} cannot be negative.`
  const bitsMatch = abiType.match(/^uint(\d*)$/)
  const bits = bitsMatch && bitsMatch[1] ? Number(bitsMatch[1]) : 256
  const max = (1n << BigInt(bits)) - 1n
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
