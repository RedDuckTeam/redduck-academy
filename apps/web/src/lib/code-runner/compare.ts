/**
 * JSON-stable deep equality with bigint normalization.
 *
 * The runner may produce `bigint` values (e.g. from EVM-decoded uint256), while
 * admin-typed expected values come from JSON.parse and never contain bigints.
 * Both sides are normalized to a canonical JSON-serializable form before
 * comparing.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b)
}

export function canonical(value: unknown): string {
  return JSON.stringify(normalize(value, true), keySorter)
}

/** 0x-prefixed 20-byte address. EVM addresses are case-insensitive (EIP-55 checksum
 *  casing is cosmetic), so we fold case before comparing — viem decodes returns as
 *  checksummed while alias/admin-typed expected values are often lowercase. */
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

function keySorter(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sorted: Record<string, unknown> = {}
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[k] = (value as Record<string, unknown>)[k]
    }
    return sorted
  }
  return value
}

function normalize(value: unknown, foldAddressCase = false): unknown {
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'string') {
    return foldAddressCase && ADDRESS_RE.test(value) ? value.toLowerCase() : value
  }
  if (Array.isArray(value)) return value.map((v) => normalize(v, foldAddressCase))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalize(v, foldAddressCase)
    }
    return out
  }
  return value
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(normalize(value), null, 2)
}
