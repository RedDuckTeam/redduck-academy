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
  return JSON.stringify(normalize(value), keySorter)
}

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

function normalize(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalize(v)
    }
    return out
  }
  return value
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(normalize(value), null, 2)
}
