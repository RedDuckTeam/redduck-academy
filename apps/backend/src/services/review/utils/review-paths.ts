import picomatch from 'picomatch'

const PICOMATCH_OPTS = { dot: true } as const

/** True if the string has glob metacharacters (backslash escapes the next character). */
export function isGlobPattern(path: string): boolean {
  for (let i = 0; i < path.length; i++) {
    const c = path[i]
    if (c === '\\' && i + 1 < path.length) {
      i++
      continue
    }
    if (c === '*' || c === '?' || c === '[' || c === '{') {
      return true
    }
  }
  return false
}

/**
 * Expands review path rows into concrete repo-relative file paths using the commit tree.
 * Glob rows with zero matches are reported in `missingPatterns` (original pattern strings).
 * Literal rows are passed through; existence is enforced when fetching.
 */
export function expandReviewPatterns(
  expected: string[],
  fileTreePaths: string[],
): { concretePaths: string[]; missingPatterns: string[] } {
  const concrete = new Set<string>()
  const missingPatterns: string[] = []

  for (const raw of expected) {
    const pattern = typeof raw === 'string' ? raw.trim() : ''
    if (pattern.length === 0) {
      continue
    }

    if (isGlobPattern(pattern)) {
      const isMatch = picomatch(pattern, PICOMATCH_OPTS)
      const matches = fileTreePaths.filter((p) => isMatch(p))
      if (matches.length === 0) {
        missingPatterns.push(pattern)
      } else {
        for (const p of matches) {
          concrete.add(p)
        }
      }
    } else {
      concrete.add(pattern)
    }
  }

  return {
    concretePaths: [...concrete].sort(),
    missingPatterns,
  }
}
