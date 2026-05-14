'use client'

import { useField } from '@payloadcms/ui'

interface SvgMarkupFieldProps {
  path: string
  field?: { label?: string; required?: boolean }
}

export function SvgMarkupField({ path, field }: SvgMarkupFieldProps) {
  const { value, setValue, errorMessage, showError } = useField<string>({ path })
  const markup = typeof value === 'string' ? value : ''

  return (
    <div className="field-type textarea" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label className="field-label">
        {field?.label ?? 'SVG markup'}
        {field?.required && <span className="required">*</span>}
      </label>

      <div
        style={{
          background: '#fff',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
          padding: '0.75rem',
          minHeight: 120,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'auto',
        }}
        aria-label="SVG preview"
      >
        {markup.trim() ? (
          <div
            style={{ maxWidth: '100%' }}
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        ) : (
          <span style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>Preview appears here</span>
        )}
      </div>

      <textarea
        value={markup}
        onChange={(e) => setValue(e.target.value)}
        rows={12}
        spellCheck={false}
        style={{
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          fontSize: 12,
          lineHeight: 1.4,
          width: '100%',
          padding: '0.5rem',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
          resize: 'vertical',
        }}
        placeholder='<svg viewBox="0 0 100 100">...</svg>'
      />

      {showError && errorMessage && <div className="field-error">{errorMessage}</div>}
    </div>
  )
}
