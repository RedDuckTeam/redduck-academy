// A line diff exists here for one reason: the freshness check has to *show* what somebody else
// merged, not merely assert it. "This lesson changed while you were editing" with no evidence is a
// message people click past, and clicking past it is how a merged fix gets pasted over.
//
// Line-granular and dependency-free. Character-level refinement inside a changed line would be
// nicer, but the question being answered is "is this someone else's work, or my own stale copy?",
// and whole lines answer it.

export interface DiffLine {
  kind: 'context' | 'added' | 'removed'
  /** 1-based line number in whichever side this line belongs to. */
  number: number
  text: string
}

export interface DiffHunk {
  lines: DiffLine[]
}

/** Unchanged lines kept either side of a change, so a hunk reads in place. */
const CONTEXT_LINES = 3

/**
 * Above this many differing lines on a side, the quadratic table below is not worth building — and
 * a diff that large is not something anyone reads line by line either.
 */
const LCS_LINE_LIMIT = 1500

/**
 * Changed hunks only, in `old` → `new` order. An empty array means the two texts are identical.
 * Returns `null` when the change is too large to diff usefully; callers show the whole file instead.
 */
export function diffLines(oldText: string, newText: string): DiffHunk[] | null {
  const before = oldText.split('\n')
  const after = newText.split('\n')

  // Shared head and tail are the overwhelming majority of a lesson edit; trimming them first is
  // what keeps the table small enough to build at all.
  let head = 0
  while (head < before.length && head < after.length && before[head] === after[head]) head++
  let tail = 0
  while (
    tail < before.length - head &&
    tail < after.length - head &&
    before[before.length - 1 - tail] === after[after.length - 1 - tail]
  ) {
    tail++
  }

  const oldMiddle = before.slice(head, before.length - tail)
  const newMiddle = after.slice(head, after.length - tail)
  if (oldMiddle.length === 0 && newMiddle.length === 0) return []
  if (oldMiddle.length > LCS_LINE_LIMIT || newMiddle.length > LCS_LINE_LIMIT) return null

  const script = backtrack(oldMiddle, newMiddle, lcsTable(oldMiddle, newMiddle), head)
  return groupHunks([
    ...before.slice(0, head).map((text, index) => contextLine(index + 1, text)),
    ...script,
    ...before.slice(before.length - tail).map((text, index) => contextLine(before.length - tail + index + 1, text)),
  ])
}

function contextLine(number: number, text: string): DiffLine {
  return { kind: 'context', number, text }
}

/** Classic LCS lengths table. `table[i][j]` is the longest common subsequence of the two suffixes. */
function lcsTable(a: string[], b: string[]): Uint32Array[] {
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  return table
}

function backtrack(a: string[], b: string[], table: Uint32Array[], offset: number): DiffLine[] {
  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push(contextLine(offset + i + 1, a[i]))
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      lines.push({ kind: 'removed', number: offset + i + 1, text: a[i] })
      i++
    } else {
      lines.push({ kind: 'added', number: offset + j + 1, text: b[j] })
      j++
    }
  }
  for (; i < a.length; i++) lines.push({ kind: 'removed', number: offset + i + 1, text: a[i] })
  for (; j < b.length; j++) lines.push({ kind: 'added', number: offset + j + 1, text: b[j] })
  return lines
}

/** Drops runs of context longer than `2 * CONTEXT_LINES`, splitting what is left into hunks. */
function groupHunks(lines: DiffLine[]): DiffHunk[] {
  const changed = lines.map((line) => line.kind !== 'context')
  const keep = lines.map((_, index) =>
    changed.slice(Math.max(0, index - CONTEXT_LINES), index + CONTEXT_LINES + 1).some(Boolean),
  )

  const hunks: DiffHunk[] = []
  let current: DiffLine[] = []
  for (const [index, line] of lines.entries()) {
    if (keep[index]) {
      current.push(line)
      continue
    }
    if (current.length > 0) hunks.push({ lines: current })
    current = []
  }
  if (current.length > 0) hunks.push({ lines: current })
  return hunks
}
