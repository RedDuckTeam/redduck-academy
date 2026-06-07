'use client'

/*
 * Error boundary for the whole Payload admin route segment.
 *
 * Next.js renders this client component whenever a server/client render below
 * `/admin/*` throws — e.g. a transient Postgres "too many connections" during an
 * SSR list view. Without it, an uncaught throw shows Next's bare error page and
 * the admin is unusable until reload. Here we show a recoverable panel with a
 * "Try again" button (`reset()` re-renders the segment) plus a hard reload.
 * See RESILIENCE-AUDIT.md → C4.
 *
 * NOTE: this is hand-authored — Payload only generates page.tsx / not-found.tsx
 * in this folder, so it won't be overwritten by `generate:importmap`.
 */

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surfaces in Vercel logs; the digest correlates with the server-side stack.
    console.error('[admin] route error boundary caught:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Something went wrong</h2>
        <p style={{ margin: '0 0 1.5rem', color: '#666', lineHeight: 1.5 }}>
          The admin hit a temporary error (often the database being briefly overloaded). Your
          content is safe — try again in a moment.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 4,
              border: 'none',
              background: '#111',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 4,
              border: '1px solid #ccc',
              background: '#fff',
              color: '#111',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  )
}
