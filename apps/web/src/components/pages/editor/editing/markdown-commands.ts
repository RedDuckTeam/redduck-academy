import type { EditorView } from '@codemirror/view'
import type { Text } from '@codemirror/state'

function runBefore(doc: Text, at: number, char: string): number {
  let length = 0
  while (at - length > 0 && doc.sliceString(at - length - 1, at - length) === char) length++
  return length
}

function runAfter(doc: Text, at: number, char: string): number {
  let length = 0
  while (at + length < doc.length && doc.sliceString(at + length, at + length + 1) === char) length++
  return length
}

export function toggleWrap(view: EditorView, marker: string): boolean {
  const { state } = view
  const range = state.selection.main
  const char = marker[0]
  const run = Math.min(runBefore(state.doc, range.from, char), runAfter(state.doc, range.to, char))

  // Unwrapping a single `*` from a `**` run would downgrade bold to italic instead of adding emphasis, so only unwrap a run that already carries this marker.
  const wrapped = char === '*' ? run === marker.length || run === 3 : run >= marker.length

  if (wrapped) {
    view.dispatch({
      changes: [
        { from: range.from - marker.length, to: range.from },
        { from: range.to, to: range.to + marker.length },
      ],
      selection: { anchor: range.from - marker.length, head: range.to - marker.length },
    })
    return true
  }

  const text = state.doc.sliceString(range.from, range.to)
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: `${marker}${text}${marker}` },
    selection: { anchor: range.from + marker.length, head: range.from + marker.length + text.length },
  })
  return true
}

export function toggleHeading(view: EditorView, level: number): boolean {
  const { state } = view
  const range = state.selection.main
  const line = state.doc.lineAt(range.from)
  const existing = /^#{1,6} /.exec(line.text)?.[0] ?? ''
  const marker = `${'#'.repeat(level)} `
  const insert = existing === marker ? '' : marker
  const shift = insert.length - existing.length

  view.dispatch({
    changes: { from: line.from, to: line.from + existing.length, insert },
    selection: { anchor: Math.max(line.from, range.anchor + shift), head: Math.max(line.from, range.head + shift) },
  })
  return true
}

export function toggleLinePrefix(view: EditorView, prefix: string): boolean {
  const { state } = view
  const range = state.selection.main
  const first = state.doc.lineAt(range.from).number
  const end = range.to > range.from ? range.to - 1 : range.to
  const last = state.doc.lineAt(Math.max(range.from, end)).number

  const lines = []
  for (let number = first; number <= last; number++) lines.push(state.doc.line(number))

  const indent = (line: { text: string }) => line.text.length - line.text.trimStart().length
  const allPrefixed = lines.every((line) => line.text.trimStart().startsWith(prefix))
  const changes: Array<{ from: number; to?: number; insert?: string }> = []
  for (const line of lines) {
    const at = line.from + indent(line)
    if (allPrefixed) changes.push({ from: at, to: at + prefix.length })
    else if (!line.text.trimStart().startsWith(prefix)) changes.push({ from: at, insert: prefix })
  }

  if (changes.length > 0) view.dispatch({ changes })
  return true
}

export function insertLink(view: EditorView): boolean {
  const range = view.state.selection.main
  const text = view.state.doc.sliceString(range.from, range.to)
  const placeholder = 'url'
  const urlFrom = range.from + text.length + '[]('.length

  view.dispatch({
    changes: { from: range.from, to: range.to, insert: `[${text}](${placeholder})` },
    selection: { anchor: urlFrom, head: urlFrom + placeholder.length },
  })
  return true
}
