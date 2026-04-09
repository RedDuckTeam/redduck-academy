import { createHash } from 'crypto'

/**
 * Normalizes source code for cache key computation.
 * Strips comments, collapses whitespace, and normalizes string quotes
 * so that cosmetically different but logically identical submissions
 * produce the same hash.
 *
 * Supports: TypeScript, Solidity, Rust/Anchor
 */
function normalizeCode(code: string, language: string): string {
  let normalized = code

  if (language === 'rust') {
    // Remove doc comments first (/// and //!)
    normalized = normalized.replace(/\/\/[/!][^\n]*/g, '')
    // Remove block comments (/* ... */)
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, ' ')
    // Remove line comments (//)
    normalized = normalized.replace(/\/\/[^\n]*/g, '')
    // Normalize string quotes: Rust only has double-quoted strings, nothing to do
  } else if (language === 'solidity') {
    // Remove NatSpec block comments (/** ... */)
    normalized = normalized.replace(/\/\*\*[\s\S]*?\*\//g, ' ')
    // Remove block comments (/* ... */)
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, ' ')
    // Remove line comments (//)
    normalized = normalized.replace(/\/\/[^\n]*/g, '')
    // Normalize double → single quotes (Solidity supports both)
    normalized = normalized.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, "'$1'")
  } else {
    // TypeScript / JavaScript
    // Remove block comments (/* ... */)
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, ' ')
    // Remove line comments (//)
    normalized = normalized.replace(/\/\/[^\n]*/g, '')
    // Normalize double → single quotes (skip escaped quotes)
    normalized = normalized.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, "'$1'")
  }

  // Collapse all whitespace (spaces, tabs, newlines) to a single space
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}

export function computeCodeHash(code: string, language: string): string {
  const normalized = normalizeCode(code, language)
  return createHash('sha256').update(normalized).digest('hex')
}
