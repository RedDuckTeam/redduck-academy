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
 * After viem decodes an EVM return, normalize bigints to decimal strings so the
 * report can be JSON-serialized by postMessage and compared via the runner's
 * deepEqual (which expects parsed-from-JSON shapes).
 */
export function normalizeReturnValue(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(normalizeReturnValue)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = normalizeReturnValue(v)
    return out
  }
  return value
}
