'use client'

import type { ReactNode } from 'react'

interface WidgetShellProps {
  label?: string
  description?: string
  error?: string | null
  children: ReactNode
}

/**
 * Visual chrome for typed-value widgets — label above, error below. Mirrors the
 * structure of Payload's default Field components so the embed feels native.
 */
export function WidgetShell({ label, description, error, children }: WidgetShellProps) {
  return (
    <div className="field-type" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {label && (
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--theme-elevation-800, #444)' }}>
          {label}
        </label>
      )}
      {children}
      {description && (
        <span style={{ fontSize: '0.75rem', color: 'var(--theme-elevation-500, #888)' }}>{description}</span>
      )}
      {error && <span style={{ fontSize: '0.8rem', color: 'var(--theme-error-500, #c63)' }}>{error}</span>}
    </div>
  )
}
