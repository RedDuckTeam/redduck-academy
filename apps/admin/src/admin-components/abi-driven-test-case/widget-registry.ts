export type WidgetKind = 'uint' | 'int' | 'bool' | 'address' | 'bytes' | 'string' | 'array' | 'json'

/**
 * Maps a Solidity ABI type string to the widget that should render its value.
 * Tuples, structs, and unrecognized types fall back to JSON literal.
 */
export function widgetForAbiType(abiType: string): WidgetKind {
  if (abiType.endsWith(']')) return 'array'
  if (/^uint\d*$/.test(abiType)) return 'uint'
  if (/^int\d*$/.test(abiType)) return 'int'
  if (abiType === 'bool') return 'bool'
  if (abiType === 'address') return 'address'
  if (abiType === 'string') return 'string'
  if (abiType.startsWith('bytes')) return 'bytes'
  return 'json'
}
