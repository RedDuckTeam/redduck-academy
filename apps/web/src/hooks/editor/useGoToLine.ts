import { useEffect, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import type { RefObject } from 'react'

interface UseGoToLineOptions {
  view: RefObject<EditorView | null>
  editorVisible: boolean
}

export function useGoToLine({ view, editorVisible }: UseGoToLineOptions) {
  const [pending, setPending] = useState<number | null>(null)

  // Deferred: in preview-only view the editor is display:none, where scrolling and focusing it silently no-op.
  useEffect(() => {
    const editor = view.current
    if (pending === null || !editor || !editorVisible) return
    setPending(null)

    const line = editor.state.doc.line(Math.min(pending, editor.state.doc.lines))
    editor.dispatch({ selection: { anchor: line.from }, scrollIntoView: true })
    editor.focus()
  }, [pending, editorVisible, view])

  return setPending
}
