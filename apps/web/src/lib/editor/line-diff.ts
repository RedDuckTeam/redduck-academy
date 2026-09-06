export interface DiffLine {
  kind: 'context' | 'added' | 'removed'
  text: string
}

export interface DiffHunk {
  lines: DiffLine[]
}

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

  const script = backtrack(oldMiddle, newMiddle, lcsTable(oldMiddle, newMiddle))
  return groupHunks([
    ...before.slice(0, head).map((text) => contextLine(text)),
    ...script,
    ...before.slice(before.length - tail).map((text) => contextLine(text)),
  ])
}

function contextLine(text: string): DiffLine {
  return { kind: 'context', text }
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

function backtrack(a: string[], b: string[], table: Uint32Array[]): DiffLine[] {
  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push(contextLine(a[i]))
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      lines.push({ kind: 'removed', text: a[i] })
      i++
    } else {
      lines.push({ kind: 'added', text: b[j] })
      j++
    }
  }
  for (; i < a.length; i++) lines.push({ kind: 'removed', text: a[i] })
  for (; j < b.length; j++) lines.push({ kind: 'added', text: b[j] })
  return lines
}

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
