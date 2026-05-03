'use client'

import { WidgetShell } from './widget-shell'

interface ArrayInputProps {
  label: string
  abiType: string
  value: string
  onChange: (next: string) => void
}

/**
 * `T[]` — newline-separated for primitives, JSON array for complex inner types.
 * The runtime parser accepts both, so author can pick either form.
 */
export function ArrayInput({ label, abiType, value, onChange }: ArrayInputProps) {
  return (
    <WidgetShell
      label={label}
      description={`One item per line, or a JSON array literal. Inner type: ${innerType(abiType)}.`}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={'item-1\nitem-2\nitem-3'}
        spellCheck={false}
        style={{
          padding: '0.5rem 0.75rem',
          fontFamily: 'var(--font-mono, monospace)',
          border: '1px solid var(--theme-elevation-200, #ccc)',
          borderRadius: '4px',
          background: 'var(--theme-input-bg, #fff)',
          color: 'var(--theme-elevation-900, #111)',
          resize: 'vertical',
        }}
      />
    </WidgetShell>
  )
}

function innerType(abiType: string): string {
  return abiType.slice(0, abiType.lastIndexOf('['))
}
