import { aliasForAddress } from '@redduck/solc-utils/src/caller-aliases'
import { formatValue } from './format-display'

/** Shorten a 0x-prefixed hex string for display (e.g. 0xabcd…1234). */
export function shortenHex(hex: string): string {
  if (hex.length <= 12) return hex
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`
}

/** Format a single Solidity raw arg string for inline call display. */
export function formatSolidityArg(raw: string, opts?: { selfLabel?: string }): string {
  const trimmed = raw.trim()
  if (trimmed === '') return '""'
  if (trimmed.startsWith('@')) return formatAlias(trimmed, opts?.selfLabel)
  if (/^0x[0-9a-fA-F]+$/.test(trimmed) && trimmed.length > 10) return shortenHex(trimmed)
  if (/^-?\d+$/.test(trimmed)) return trimmed
  if (trimmed === 'true' || trimmed === 'false') return trimmed
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    return trimmed
  }
  return `"${trimmed}"`
}

/**
 * Strip the `@` prefix for display. `@self` is special-cased to the student's
 * contract name (if known) so the UI reads as `Vault.deposit(...)` rather than
 * `@self.deposit(...)`. Falls back to `address(this)` when no name is available.
 */
function formatAlias(raw: string, selfLabel: string | undefined): string {
  const alias = raw.startsWith('@') ? raw.slice(1) : raw
  if (alias.toLowerCase() === 'self') return selfLabel && selfLabel.trim() !== '' ? selfLabel : 'address(this)'
  return alias
}

/**
 * Format a step's raw `expected` value for display. A bare `@alias` reference
 * renders as the plain alias name (`@alice` → `alice`, `@self` → contract name)
 * so it lines up with how the decoded `got` value is shown. Everything else
 * (numbers, bools, JSON arrays) is shown verbatim as authored.
 */
export function formatExpected(raw: string, opts?: { selfLabel?: string }): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('@')) return formatAlias(trimmed, opts?.selfLabel)
  return raw
}

/**
 * Format a decoded `got` value for display. Addresses matching a known EOA
 * alias render as the alias name (`0x…a11ce` → `alice`) so a failed assertion
 * lines up with its `expected:` alias. Nested addresses inside arrays/objects
 * are substituted too; other values fall back to JSON formatting.
 */
export function formatGot(value: unknown): string {
  if (typeof value === 'string') {
    const alias = aliasForAddress(value)
    return alias ?? formatValue(value)
  }
  return formatValue(mapAliasAddresses(value))
}

/** Recursively replace known EOA alias addresses with their names. */
function mapAliasAddresses(value: unknown): unknown {
  if (typeof value === 'string') return aliasForAddress(value) ?? value
  if (Array.isArray(value)) return value.map(mapAliasAddresses)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapAliasAddresses(v)]))
  }
  return value
}

/** Format a wei amount string into the most readable unit (ETH / gwei / wei). */
export function formatValueWei(valueWei: string): string {
  let wei: bigint
  try {
    wei = BigInt(valueWei)
  } catch {
    return valueWei
  }
  if (wei === 0n) return '0 wei'
  const ETH = 1_000_000_000_000_000_000n
  const GWEI = 1_000_000_000n
  if (wei % ETH === 0n) return `${wei / ETH} ETH`
  if (wei >= ETH / 1000n) return `${trimFractional((Number(wei) / 1e18).toFixed(6))} ETH`
  if (wei % GWEI === 0n) return `${wei / GWEI} gwei`
  if (wei >= GWEI / 1000n) return `${trimFractional((Number(wei) / 1e9).toFixed(6))} gwei`
  return `${wei} wei`
}

/** Format a caller alias / hex address for display. */
export function formatCaller(caller: string, opts?: { selfLabel?: string }): string {
  const trimmed = caller.trim()
  if (/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return shortenHex(trimmed)
  if (trimmed.startsWith('@')) return formatAlias(trimmed, opts?.selfLabel)
  return trimmed
}

/**
 * Label for a step's `target` contract when it isn't the student's contract.
 * Returns `null` for blank / `@self` (no prefix should be rendered — the call
 * is on the student's own contract, which is the implicit case). Aliases drop
 * their `@`; raw 0x addresses are shortened.
 */
export function formatTargetPrefix(target: string | undefined | null): string | null {
  if (!target) return null
  const trimmed = target.trim()
  if (trimmed === '' || trimmed.toLowerCase() === '@self') return null
  if (trimmed.startsWith('@')) return trimmed.slice(1)
  if (/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return shortenHex(trimmed)
  return trimmed
}

function trimFractional(s: string): string {
  if (!s.includes('.')) return s
  return s.replace(/0+$/, '').replace(/\.$/, '')
}
