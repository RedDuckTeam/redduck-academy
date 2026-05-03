/**
 * Pulls argument names out of a function/contract signature.
 *
 * TS form: `solve(nums: number[], target: number): number[]` → ['nums', 'target']
 * Solidity form: `function add(uint256 a, uint256 b) external pure returns (uint256)` → ['a', 'b']
 * Unnamed Solidity args: `function add(uint256, uint256) external` → ['arg1', 'arg2']
 */
export function extractArgNames(signature: string | null | undefined, count: number): string[] {
  const fallback = (i: number) => `arg${i + 1}`
  if (!signature) return Array.from({ length: count }, (_, i) => fallback(i))

  // First parens group is the argument list. Don't try the `returns(...)` group.
  const m = signature.match(/\(([^)]*)\)/)
  if (!m) return Array.from({ length: count }, (_, i) => fallback(i))

  const inner = m[1].trim()
  if (!inner) return Array.from({ length: count }, (_, i) => fallback(i))

  const parts = splitTopLevel(inner)
  // If the signature lists fewer args than the test case provides, pad with fallbacks.
  return Array.from({ length: Math.max(parts.length, count) }, (_, i) => {
    const part = parts[i]
    if (!part) return fallback(i)
    if (part.includes(':')) {
      // TS form: "name: type"
      const name = part.split(':')[0].trim()
      return name || fallback(i)
    }
    // Solidity form: tokens like ["uint256", "memory", "name"]; name is the last token.
    const tokens = part.split(/\s+/).filter(Boolean)
    if (tokens.length <= 1) return fallback(i)
    return tokens[tokens.length - 1]
  })
}

/** Split on commas at depth 0 only — keeps `number[]`, generics, and tuples intact. */
function splitTopLevel(input: string): string[] {
  const out: string[] = []
  let depth = 0
  let current = ''
  for (const ch of input) {
    if (ch === '(' || ch === '[' || ch === '<' || ch === '{') depth++
    else if (ch === ')' || ch === ']' || ch === '>' || ch === '}') depth--
    if (ch === ',' && depth === 0) {
      out.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) out.push(current.trim())
  return out
}
