import { syntaxTree } from '@codemirror/language'
import { Decoration, EditorView, ViewPlugin } from '@codemirror/view'
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import type { EditorState, Extension, Range, Text } from '@codemirror/state'
import type { SyntaxNode } from '@lezer/common'

/**
 * Obsidian's live-preview model: the buffer stays raw Markdown — that is the whole point of §2.1 —
 * but every syntax marker on a line the cursor is not on is hidden, and the text it governs is
 * styled. Move into the line and the markers come straight back, so what you edit is always what
 * is in the file.
 *
 * Decisions are taken from the Lezer tree rather than from regexes, which is also what keeps
 * fenced code untouched: inside a `FencedCode` node there are no `Emphasis` or `ATXHeading` nodes
 * to decorate, so a `**` or a leading `#` in a code sample is left exactly as typed.
 */

const HEADING_CLASS: Record<string, string> = {
  ATXHeading1: 'cm-md-h1',
  ATXHeading2: 'cm-md-h2',
  ATXHeading3: 'cm-md-h3',
  ATXHeading4: 'cm-md-h4',
  ATXHeading5: 'cm-md-h5',
  ATXHeading6: 'cm-md-h6',
}

const hidden = Decoration.replace({})
const strongStyle = Decoration.mark({ class: 'cm-md-strong' })
const emphasisStyle = Decoration.mark({ class: 'cm-md-em' })
const codeStyle = Decoration.mark({ class: 'cm-md-code' })
const linkStyle = Decoration.mark({ class: 'cm-md-link' })

/** Lines touched by any cursor or selection. Markers on these stay visible so they can be edited. */
function revealedLines(state: EditorState): Set<number> {
  const lines = new Set<number>()
  for (const range of state.selection.ranges) {
    const first = state.doc.lineAt(range.from).number
    const last = state.doc.lineAt(range.to).number
    for (let line = first; line <= last; line++) lines.add(line)
  }
  return lines
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

  // Two marks and no label is a bracket pair that never resolved into a link — `[1]` inside the
  // text of a real link parses as its own Link node — so hiding its brackets would hide markup the
  // contributor typed and leave the `](url)` they wanted hidden on screen.
  if (marks.length < 4 && node.getChild('LinkLabel') === null) return

  // A replacing decoration may not span a line break when it comes from a ViewPlugin:
  // @codemirror/view throws mid-update, React never sees the keystroke, and every later dispatch
  // fails too — the editor stops accepting input. A destination wrapped onto the next line
  // (`[text](\nurl)`) stays visible instead.
  if (doc.lineAt(marks[1].from).number !== doc.lineAt(node.to).number) return

  // `[` on its own, then everything from `]` to the closing paren — the destination is what the
  // reader does not need to see, and hiding it as one span keeps the decoration count down.
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
              // Swallow the space after `##` too, or the heading text sits one column in.
              const end = doc.sliceString(mark.to, mark.to + 1) === ' ' ? mark.to + 1 : mark.to
              decorations.push(hidden.range(mark.from, end))
            }
          }
          return
        }

        const isRevealed = revealed.has(doc.lineAt(nodeRef.from).number)

        switch (nodeRef.name) {
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
      // `selectionSet` is the one that matters for reveal-on-cursor; without it the markers of the
      // line you just arrived on would stay hidden until the next edit.
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
})

export function livePreview(): Extension {
  return [livePreviewPlugin, livePreviewTheme]
}
