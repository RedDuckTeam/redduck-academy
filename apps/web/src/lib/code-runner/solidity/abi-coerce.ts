/**
 * Coerce JSON-derived args to types viem expects for ABI encoding (mainly bigint for uint/int).
 */
export function coerceArgs(args: unknown[], inputs: readonly { type: string }[]): unknown[] {
  return args.map((arg, i) => coerceOne(arg, inputs[i]?.type ?? ''))
}

function coerceOne(arg: unknown, type: string): unknown {
  if (type.endsWith(']')) {
    if (!Array.isArray(arg)) return arg
    const inner = type.slice(0, type.lastIndexOf('['))
    return arg.map((item) => coerceOne(item, inner))
  }
  if (/^u?int\d*$/.test(type)) {
    if (typeof arg === 'string' || typeof arg === 'number') {
      try {
        return BigInt(arg)
      } catch {
        return arg
      }
    }
  }
  return arg
}

/**
 * After viem decodes an EVM return, normalize numeric scalars to decimal strings.
 *
 * Two cases matter:
 *  - `bigint` (returned for uint64+ / int64+) → toString.
 *  - integer `number` (returned for uint8…uint53 / int8…int53) → toString.
 *
 * Both branches must stringify so the comparison treats `uint8` returns identically
 * to `uint256` returns. Without this, `parseTypedValue` (which always produces
 * bigint for uint*) would mismatch viem's small-uint decode. Floats (non-integer
 * numbers) pass through untouched — they don't appear in Solidity ABI returns.
 *
 * The string form also keeps postMessage JSON-serializable across the worker
 * boundary, which doesn't ship bigint through structured clone.
 */
export function normalizeReturnValue(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'number' && Number.isInteger(value)) return value.toString()
  if (Array.isArray(value)) return value.map(normalizeReturnValue)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = normalizeReturnValue(v)
    return out
  }
  return value
}
