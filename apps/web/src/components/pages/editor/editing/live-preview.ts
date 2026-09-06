import { syntaxTree } from '@codemirror/language'
import { Decoration, EditorView, ViewPlugin } from '@codemirror/view'
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import type { EditorState, Extension, Range, Text } from '@codemirror/state'
import type { SyntaxNode } from '@lezer/common'

const HEADING_CLASS: Record<string, string> = {
  ATXHeading1: 'cm-md-h1',
  ATXHeading2: 'cm-md-h2',
  ATXHeading3: 'cm-md-h3',
  ATXHeading4: 'cm-md-h4',
  ATXHeading5: 'cm-md-h5',
  ATXHeading6: 'cm-md-h6',
}

const hidden = Decoration.replace({})
const fenceLine = Decoration.line({ class: 'cm-md-fence' })
const quoteLine = Decoration.line({ class: 'cm-md-quote' })
const strongStyle = Decoration.mark({ class: 'cm-md-strong' })
const emphasisStyle = Decoration.mark({ class: 'cm-md-em' })
const codeStyle = Decoration.mark({ class: 'cm-md-code' })
const linkStyle = Decoration.mark({ class: 'cm-md-link' })
const listMarkStyle = Decoration.mark({ class: 'cm-md-list-mark' })

function revealedLines(state: EditorState): Set<number> {
  const lines = new Set<number>()
  for (const range of state.selection.ranges) {
    const first = state.doc.lineAt(range.from).number
    const last = state.doc.lineAt(range.to).number
    for (let line = first; line <= last; line++) lines.add(line)
  }
  return lines
}

function decorateLines(doc: Text, from: number, to: number, style: Decoration, into: Array<Range<Decoration>>): void {
  let pos = from
  while (pos <= to) {
    const line = doc.lineAt(pos)
    into.push(style.range(line.from))
    if (line.to >= to) return
    pos = line.to + 1
  }
}

function hideMarks(node: SyntaxNode, name: string, into: Array<Range<Decoration>>): void {
  for (const mark of node.getChildren(name)) into.push(hidden.range(mark.from, mark.to))
}

function styleInner(node: SyntaxNode, markName: string, style: Decoration, into: Array<Range<Decoration>>): void {
  const marks = node.getChildren(markName)
  const from = marks[0]?.to ?? node.from
  const to = marks[marks.length - 1]?.from ?? node.to
  if (from < to) into.push(style.range(from, to))
}

function decorateLink(node: SyntaxNode, doc: Text, revealed: boolean, into: Array<Range<Decoration>>): void {
  const marks = node.getChildren('LinkMark')
  const textFrom = marks[0]?.to ?? node.from
  const textTo = marks[1]?.from ?? node.to
  if (textFrom < textTo) into.push(linkStyle.range(textFrom, textTo))
  if (revealed || marks.length < 2) return

  if (marks.length < 4 && node.getChild('LinkLabel') === null) return

  // A replacing decoration can't span a line break inside a ViewPlugin — CodeMirror throws mid-update and the editor stops accepting input.
  if (doc.lineAt(marks[1].from).number !== doc.lineAt(node.to).number) return

  into.push(hidden.range(marks[0].from, marks[0].to))
  into.push(hidden.range(marks[1].from, node.to))
}

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: Array<Range<Decoration>> = []
  const revealed = revealedLines(view.state)
  const doc: Text = view.state.doc
  const tree = syntaxTree(view.state)

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter: (nodeRef) => {
        const node = nodeRef.node
        const headingClass = HEADING_CLASS[nodeRef.name]

        if (headingClass) {
          const line = doc.lineAt(nodeRef.from)
          decorations.push(Decoration.line({ class: headingClass }).range(line.from))
          if (!revealed.has(line.number)) {
            for (const mark of node.getChildren('HeaderMark')) {
              const end = doc.sliceString(mark.to, mark.to + 1) === ' ' ? mark.to + 1 : mark.to
              decorations.push(hidden.range(mark.from, end))
            }
          }
          return
        }

        const isRevealed = revealed.has(doc.lineAt(nodeRef.from).number)

        switch (nodeRef.name) {
          case 'FencedCode':
          case 'CodeBlock':
            decorateLines(doc, Math.max(nodeRef.from, from), Math.min(nodeRef.to, to), fenceLine, decorations)
            return false
          case 'Blockquote':
            decorateLines(doc, Math.max(nodeRef.from, from), Math.min(nodeRef.to, to), quoteLine, decorations)
            return
          case 'ListMark':
            decorations.push(listMarkStyle.range(nodeRef.from, nodeRef.to))
            return
          case 'StrongEmphasis':
            styleInner(node, 'EmphasisMark', strongStyle, decorations)
            if (!isRevealed) hideMarks(node, 'EmphasisMark', decorations)
            return
          case 'Emphasis':
            styleInner(node, 'EmphasisMark', emphasisStyle, decorations)
            if (!isRevealed) hideMarks(node, 'EmphasisMark', decorations)
            return
          case 'InlineCode':
            styleInner(node, 'CodeMark', codeStyle, decorations)
            if (!isRevealed) hideMarks(node, 'CodeMark', decorations)
            return
          case 'Link':
            decorateLink(node, doc, isRevealed, decorations)
            return
          default:
            return
        }
      },
    })
  }

  return Decoration.set(decorations, true)
}

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
)

const livePreviewTheme = EditorView.theme({
  '.cm-md-h1': { fontSize: '1.7em', fontWeight: '600', lineHeight: '1.3' },
  '.cm-md-h2': { fontSize: '1.4em', fontWeight: '600', lineHeight: '1.3' },
  '.cm-md-h3': { fontSize: '1.2em', fontWeight: '600', lineHeight: '1.35' },
  '.cm-md-h4': { fontSize: '1.1em', fontWeight: '600' },
  '.cm-md-h5': { fontWeight: '600' },
  '.cm-md-h6': { fontWeight: '600', opacity: '0.8' },
  '.cm-md-strong': { fontWeight: '700' },
  '.cm-md-em': { fontStyle: 'italic' },
  '.cm-md-code': {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.9em',
    backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)',
    padding: '0.1em 0.25em',
  },
  '.cm-md-link': { color: 'var(--primary)', textDecoration: 'underline' },
  '.cm-md-fence': {
    backgroundColor: 'color-mix(in srgb, currentColor 7%, transparent)',
    boxShadow: 'inset 2px 0 0 color-mix(in srgb, currentColor 25%, transparent)',
  },
  '.cm-md-quote': {
    boxShadow: 'inset 2px 0 0 color-mix(in srgb, currentColor 30%, transparent)',
    paddingLeft: '0.75em',
    opacity: '0.85',
  },
  '.cm-md-list-mark': { color: 'var(--primary)' },
})

export function livePreview(): Extension {
  return [livePreviewPlugin, livePreviewTheme]
}
