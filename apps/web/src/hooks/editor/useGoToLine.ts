import { useEffect, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import type { RefObject } from 'react'

interface UseGoToLineOptions {
  view: RefObject<EditorView | null>
  /** Lines the frontmatter occupies, which the buffer below it does not hold. */
  frontmatterLines: number
  editorVisible: boolean
}

export function useGoToLine({ view, frontmatterLines, editorVisible }: UseGoToLineOptions) {
  const [pending, setPending] = useState<number | null>(null)

  // Recorded rather than acted on immediately: in preview-only view the editor is display:none, so
  // scrolling and focusing it would be a no-op.
  useEffect(() => {
    const editor = view.current
    if (pending === null || !editor || !editorVisible) return
    setPending(null)

    const bodyLine = pending - frontmatterLines
    if (bodyLine < 1) return
    const line = editor.state.doc.line(Math.min(bodyLine, editor.state.doc.lines))
    editor.dispatch({ selection: { anchor: line.from }, scrollIntoView: true })
    editor.focus()
  }, [pending, editorVisible, frontmatterLines, view])

  return setPending
}
