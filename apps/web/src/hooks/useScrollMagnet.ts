import { useEffect } from 'react'

interface UseScrollMagnetOptions {
  enabled: boolean
  targetId: string
  offset?: number
  range?: number
}

export function useScrollMagnet({ enabled, targetId, offset = 20, range = 40 }: UseScrollMagnetOptions) {
  useEffect(() => {
    if (!enabled) return

    let snapping = false
    let scrollTimeout: number | null = null

    const onScroll = () => {
      if (snapping) return
      if (scrollTimeout) window.clearTimeout(scrollTimeout)
      scrollTimeout = window.setTimeout(() => {
        const target = document.getElementById(targetId)
        if (!target) return
        const y = window.scrollY
        const targetY = target.getBoundingClientRect().top + y - offset
        const distance = targetY - y
        if (distance !== 0 && Math.abs(distance) <= range) {
          snapping = true
          window.scrollTo({ top: targetY, behavior: 'smooth' })
          window.setTimeout(() => {
            snapping = false
          }, 700)
        }
      }, 120)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollTimeout) window.clearTimeout(scrollTimeout)
    }
  }, [enabled, targetId, offset, range])
}
