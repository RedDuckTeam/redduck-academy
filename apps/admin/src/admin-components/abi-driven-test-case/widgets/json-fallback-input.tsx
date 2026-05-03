'use client'

import { WidgetShell } from './widget-shell'

interface JsonFallbackInputProps {
  label: string
  abiType?: string
  value: string
  onChange: (next: string) => void
}

/**
 * Catch-all — tuples, structs, types we can't statically split into primitive widgets,
 * or paths where the ABI isn't ready yet. Author types a JSON literal of the value.
 */
export function JsonFallbackInput({ label, abiType, value, onChange }: JsonFallbackInputProps) {
  const error = validate(value)
  const desc = abiType
    ? `JSON literal for type ${abiType}.`
    : 'JSON literal — ABI not available; falling back to raw mode.'
  return (
    <WidgetShell label={label} description={desc} error={error}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder='e.g. "0x1234..." or [1,2,3]'
        spellCheck={false}
        style={{
          padding: '0.5rem 0.75rem',
          fontFamily: 'var(--font-mono, monospace)',
          border: `1px solid var(${error ? '--theme-error-500' : '--theme-elevation-200'}, #ccc)`,
          borderRadius: '4px',
          background: 'var(--theme-input-bg, #fff)',
          color: 'var(--theme-elevation-900, #111)',
          resize: 'vertical',
        }}
      />
    </WidgetShell>
  )
}

function validate(raw: string): string | null {
  if (raw.trim() === '') return null
  try {
    JSON.parse(raw)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid JSON.'
  }
}
