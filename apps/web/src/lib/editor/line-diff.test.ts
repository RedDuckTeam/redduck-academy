import { describe, expect, it } from 'vitest'
import { diffLines } from './line-diff'

const body = (lines: number) => Array.from({ length: lines }, (_, index) => `line ${index + 1}`).join('\n')

describe('diffLines', () => {
  it('reports no hunks for identical text', () => {
    expect(diffLines(body(20), body(20))).toEqual([])
  })

  it('marks a replaced line as one removal and one addition', () => {
    const hunks = diffLines('a\nb\nc', 'a\nB\nc')
    expect(hunks).toHaveLength(1)
    expect(hunks?.[0].lines.filter((line) => line.kind === 'removed').map((line) => line.text)).toEqual(['b'])
    expect(hunks?.[0].lines.filter((line) => line.kind === 'added').map((line) => line.text)).toEqual(['B'])
  })

  it('keeps context around a change but drops the rest of a long file', () => {
    const before = body(200)
    const after = before.replace('line 100', 'line one hundred')
    const hunks = diffLines(before, after)

    expect(hunks).toHaveLength(1)
    // Three lines of context either side, plus the removal and the addition.
    expect(hunks?.[0].lines).toHaveLength(8)
    expect(hunks?.[0].lines[0].text).toBe('line 97')
  })

  it('splits distant changes into separate hunks', () => {
    const before = body(200)
    const after = before.replace('line 10\n', 'ten\n').replace('line 150\n', 'one fifty\n')
    expect(diffLines(before, after)).toHaveLength(2)
  })

  it('numbers removals against the old text and additions against the new', () => {
    const hunks = diffLines('a\nb\nc', 'a\nx\ny\nc')
    const lines = hunks?.[0].lines ?? []
    expect(lines.find((line) => line.text === 'b')?.number).toBe(2)
    expect(lines.find((line) => line.text === 'y')?.number).toBe(3)
  })

  it('gives up rather than build an unusable table for a wholesale rewrite', () => {
    const before = Array.from({ length: 2000 }, (_, index) => `old ${index}`).join('\n')
    const after = Array.from({ length: 2000 }, (_, index) => `new ${index}`).join('\n')
    expect(diffLines(before, after)).toBeNull()
  })

  it('handles an insertion at the very end', () => {
    const hunks = diffLines('a\nb', 'a\nb\nc')
    expect(hunks?.[0].lines.filter((line) => line.kind === 'added').map((line) => line.text)).toEqual(['c'])
  })
})
