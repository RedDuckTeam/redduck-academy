'use client'

import type { SerializedEditorState } from 'lexical'
import { useState } from 'react'
import { useField } from '@payloadcms/ui'
import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'

export function LessonPreviewButton() {
  const { value } = useField<SerializedEditorState | null>({ path: 'content' })
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="btn btn--style-primary btn--size-medium"
        onClick={() => setOpen(true)}
      >
        Preview
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              color: '#111',
              maxWidth: 960,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 8,
              padding: '2rem',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close preview"
              style={{
                position: 'sticky',
                top: 0,
                float: 'right',
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '0.4rem 0.8rem',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Close
            </button>
            <PreviewContent data={value ?? null} />
          </div>
        </div>
      )}
    </>
  )
}

function PreviewContent({ data }: { data: SerializedEditorState | null }) {
  if (!data) return <p style={{ color: '#666' }}>Nothing to preview yet.</p>

  // Buffer across paragraphs so multi-line <svg>...</svg> markup pasted as separate
  // paragraphs collapses into a single rendered diagram — same logic as the frontend renderer.
  let svgBuffer: string | null = null

  const renderSvg = (markup: string, key: string) => (
    <div
      key={key}
      style={{ margin: '1rem 0', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
      <PayloadRichText
        data={data as any}
        converters={({ defaultConverters }) => ({
          ...defaultConverters,
          paragraph: ({ node, nodesToJSX, parent, childIndex }) => {
            const rawText = (node.children as Array<{ type?: string; text?: string }>)
              .map((c) => (c.type === 'text' ? (c.text ?? '') : c.type === 'linebreak' ? '\n' : ''))
              .join('')

            const key = `p-${childIndex ?? Math.random()}`

            if (svgBuffer !== null) {
              svgBuffer += '\n' + rawText
              if (svgBuffer.trimEnd().endsWith('</svg>')) {
                const markup = svgBuffer.trim()
                svgBuffer = null
                return renderSvg(markup, key)
              }
              return <span key={key} />
            }

            const trimmed = rawText.trim()
            if (trimmed.startsWith('<svg')) {
              if (trimmed.endsWith('</svg>')) return renderSvg(trimmed, key)
              svgBuffer = rawText
              return <span key={key} />
            }

            const defaultParagraph = defaultConverters.paragraph
            if (typeof defaultParagraph === 'function') {
              return defaultParagraph({ node, nodesToJSX, parent, childIndex } as never)
            }
            return <p key={key}>{nodesToJSX({ nodes: node.children })}</p>
          },
        })}
      />
    </div>
  )
}
