import { Editor } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import { registerLanguages } from '@/lib/monaco-languages'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: 'solidity' | 'rust'
}

export function CodeEditor({ value, onChange, language = 'solidity' }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={containerRef} className="monaco-transparent">
      <Editor
        height="560px"
        defaultLanguage={language}
        language={language}
        theme="vs-light"
        value={value}
        onChange={(val) => onChange(val ?? '')}
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
}
