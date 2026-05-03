/**
 * Converts an admin-authored canonical string (e.g. `"5"`, `"true"`, `"0x000…c0de"`,
 * `"hello world"`, `"[1,2,3]"`) into the JS value matching `abiType`.
 *
 *  - `uint*` / `int*`           → bigint
 *  - `bool`                     → boolean
 *  - `address` / `bytes*`       → hex string (passed through)
 *  - `string`                   → string (raw, no quote unwrapping)
 *  - `T[]`                      → array, each element parsed with `T` recursively
 *  - tuples / unknown           → JSON-parsed
 *
 * Throws on shape errors so callers can surface `Test case N: invalid bool 'yes'` etc.
 */
export function parseTypedValue(raw: string, abiType: string): unknown {
  const value = raw

  if (abiType.endsWith(']')) {
    const innerType = abiType.slice(0, abiType.lastIndexOf('['))
    return parseArrayValue(value, innerType)
  }

  if (/^u?int\d*$/.test(abiType)) {
    try {
      return BigInt(value.trim())
    } catch {
      throw new Error(`Invalid ${abiType}: '${value}'`)
    }
  }

  if (abiType === 'bool') {
    const trimmed = value.trim().toLowerCase()
    if (trimmed === 'true') return true
    if (trimmed === 'false') return false
    throw new Error(`Invalid bool: '${value}' (expected 'true' or 'false')`)
  }

  if (abiType === 'address' || abiType === 'string' || abiType.startsWith('bytes')) {
    return value
  }

  // tuple, struct, or unknown — admin types JSON literal
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(`Invalid JSON for type ${abiType}: '${value}'`)
  }
}

function parseArrayValue(raw: string, innerType: string): unknown[] {
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed === '[]') return []

  // Admin may type a JSON array OR newline-separated items.
  if (trimmed.startsWith('[')) {
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      throw new Error(`Invalid array literal for ${innerType}[]: '${raw}'`)
    }
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected array for ${innerType}[], got ${typeof parsed}`)
    }
    return parsed.map((item) => parseTypedValue(typeof item === 'string' ? item : JSON.stringify(item), innerType))
  }

  return trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseTypedValue(line, innerType))
}
