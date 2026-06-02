import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Rendered when a descendant throws during render. Defaults to nothing. */
  fallback?: ReactNode
  onError?: (error: unknown) => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Generic React error boundary. Render errors that bubble here are contained:
 * they don't reach (and tear down) ancestors. Use it to wrap provider trees or
 * untrusted content (e.g. CMS rich text) so a single bad node can't white-screen
 * the whole app.
 *
 * Note: React still reports caught errors to the root `onCaughtError` hook (see
 * `src/client.tsx`), which forwards them to Sentry — this only controls the UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}
