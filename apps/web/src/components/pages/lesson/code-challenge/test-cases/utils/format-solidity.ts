/** Shorten a 0x-prefixed hex string for display (e.g. 0xabcd…1234). */
export function shortenHex(hex: string): string {
  if (hex.length <= 12) return hex
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`
}

/** Format a single Solidity raw arg string for inline call display. */
export function formatSolidityArg(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '') return '""'
  if (/^0x[0-9a-fA-F]+$/.test(trimmed) && trimmed.length > 10) return shortenHex(trimmed)
  if (/^-?\d+$/.test(trimmed)) return trimmed
  if (trimmed === 'true' || trimmed === 'false') return trimmed
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    return trimmed
  }
  return `"${trimmed}"`
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
export function formatCaller(caller: string): string {
  const trimmed = caller.trim()
  if (/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return shortenHex(trimmed)
  return trimmed
}

function trimFractional(s: string): string {
  if (!s.includes('.')) return s
  return s.replace(/0+$/, '').replace(/\.$/, '')
}
