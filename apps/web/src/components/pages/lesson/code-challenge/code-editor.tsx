import { Editor, type OnMount } from '@monaco-editor/react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { editor } from 'monaco-editor'
import { useTheme } from '@/components/providers/theme-context'
import { registerLanguages } from '@/lib/monaco-languages'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: 'solidity' | 'rust' | 'typescript'
}

export interface CodeEditorHandle {
  format: () => void
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { value, onChange, language = 'solidity' },
  ref,
) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs-light'
  const [editorHeight, setEditorHeight] = useState<number>(560)

  useImperativeHandle(ref, () => ({
    format: () => editorRef.current?.getAction('editor.action.formatDocument')?.run(),
  }))

  const handleMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance
  }

  useEffect(() => {
    if (!containerRef.current) return

    const style = document.createElement('style')
    style.textContent = `
      .monaco-transparent .monaco-editor,
      .monaco-transparent .monaco-editor .margin,
      .monaco-transparent .monaco-editor-background,
      .monaco-transparent .monaco-editor .inputarea.ime-input {
        background-color: transparent !important;
      }
      .monaco-transparent .monaco-editor .overflow-guard {
        border: none !important;
      }
      .monaco-transparent .monaco-editor .lines-content {
        background: transparent !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height
      if (h > 100) setEditorHeight(h)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="monaco-transparent h-full pb-5">
      <Editor
        key={monacoTheme}
        height={editorHeight}
        width="100%"
        defaultLanguage={language}
        language={language}
        theme={monacoTheme}
        value={value}
        onChange={(val) => onChange(val ?? '')}
        onMount={handleMount}
        beforeMount={(monaco) => {
          registerLanguages(monaco)
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'IBM Plex Mono', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 0, bottom: 0 },
          renderLineHighlight: 'none',
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
          },
        }}
      />
    </div>
  )
})
