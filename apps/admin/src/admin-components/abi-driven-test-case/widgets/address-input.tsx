'use client'

import { CALLER_ALIAS_NAMES } from '@redduck/solc-utils/src/caller-aliases'
import { WidgetShell } from './widget-shell'

interface AddressInputProps {
  label: string
  value: string
  onChange: (next: string) => void
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
// Lenient: any well-formed @identifier passes save-time validation. The runner
// validates against the actual alias set (EOAs + this lesson's fixtures + @self)
// when the test runs. Keeping the widget lenient means admins can reference a
// fixture they're about to define without field-order gotchas.
const ALIAS_RE = /^@[a-zA-Z_][a-zA-Z0-9_]*$/
// Helpful baseline list, derived from the shared alias source of truth.
// Fixture aliases (and @self) extend this at runtime.
const KNOWN_EOA_ALIASES = [...CALLER_ALIAS_NAMES.map((name) => `@${name}`), '@self']

/** `address` — 0x-prefixed 20-byte hex, or an @-prefixed alias. */
export function AddressInput({ label, value, onChange }: AddressInputProps) {
  const trimmed = value.trim()
  const isValid = trimmed === '' || ALIAS_RE.test(trimmed) || ADDRESS_RE.test(trimmed)
  const error = isValid
    ? null
    : 'Expected an @-prefixed alias (e.g. @alice) or a 0x-prefixed 40-hex address.'
  return (
    <WidgetShell
      label={label}
      description={`20-byte hex address, or an @-prefixed alias. Built-in: ${KNOWN_EOA_ALIASES.join(', ')}. Fixtures defined on this lesson are also valid (e.g. @mockToken).`}
      error={error}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="@alice or 0x0000000000000000000000000000000000000000"
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
