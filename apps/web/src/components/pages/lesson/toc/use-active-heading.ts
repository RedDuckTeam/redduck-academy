import { useEffect, useState } from 'react'

const ACTIVATION_OFFSET = 120

export function useActiveHeading(ids: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null)

  useEffect(() => {
    if (ids.length === 0) {
      setActiveId(null)
      return
    }

    let frame = 0
    const update = () => {
      let current: string | null = ids[0] ?? null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top - ACTIVATION_OFFSET <= 0) {
          current = id
        } else {
          break
        }
      }
      setActiveId(current)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])

  return activeId
}
