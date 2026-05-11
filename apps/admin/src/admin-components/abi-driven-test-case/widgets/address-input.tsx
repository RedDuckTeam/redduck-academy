'use client'

import { WidgetShell } from './widget-shell'

interface AddressInputProps {
  label: string
  value: string
  onChange: (next: string) => void
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
// Keep in sync with CALLER_ALIASES in apps/web/.../run-test-case.ts and the
// validator in packages/payload-config/.../Lessons.ts. The runner expands these
// to their EOA addresses at EVM-call time.
const ALIAS_NAMES = ['default', 'alice', 'bob', 'carol', 'dave']
const ALIAS_RE = new RegExp(`^@?(?:${ALIAS_NAMES.join('|')})$`, 'i')

/** `address` — 0x-prefixed 20-byte hex, or a named caller alias (alice, bob, ...). */
export function AddressInput({ label, value, onChange }: AddressInputProps) {
  const trimmed = value.trim()
  const isValid = trimmed === '' || ALIAS_RE.test(trimmed) || ADDRESS_RE.test(trimmed)
  const error = isValid ? null : `Expected 0x + 40 hex chars, or an alias (${ALIAS_NAMES.join(', ')}).`
  return (
    <WidgetShell
      label={label}
      description={`20-byte hex address, or an alias: ${ALIAS_NAMES.join(', ')}.`}
      error={error}
    >
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
