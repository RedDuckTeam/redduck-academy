import { useAutoAnimate } from '@formkit/auto-animate/react'
import type { Ref } from 'react'
import { StatusBar } from '../../status-bar'
import type { StatusBarState } from './use-status-bar-state'

interface CodePanelStatusBarProps {
  state: StatusBarState
}

export function CodePanelStatusBar({ state }: CodePanelStatusBarProps) {
  const [parent] = useAutoAnimate({ duration: 180, easing: 'ease-in-out' })
  return (
    <div ref={parent as Ref<HTMLDivElement>} className="absolute bottom-0 left-0 right-0">
      {state.kind === 'live' && <StatusBar key="live" passed={state.passed} />}
      {state.kind === 'latest' && <StatusBar key="latest" passed={state.passed} />}
      {state.kind === 'rate-limit' && <StatusBar key="rate-limit" rateLimitMessage={state.message} />}
    </div>
  )
}
