import { useRouter } from '@tanstack/react-router'
import { useLayoutEffect, useMemo, useState } from 'react'

export const headerLinks = [
  {
    to: '/dashboard',
    text: 'MY PROGRESS',
  },
  {
    to: '/courses',
    text: 'COURSE PROGRAM',
  },
  {
    to: '/ranking',
    text: 'RANKING',
  },
]

export const useHeaderLinks = () => {
  const router = useRouter()
  const refs = useMemo(() => {
    return headerLinks.map(() => ({ current: null }) as unknown as React.RefObject<HTMLAnchorElement>)
  }, [])
  const [triangleLeft, setTriangleLeft] = useState<number>(0)

  const activeLinkRef = useMemo(() => {
    const currentPath = router.state.location.pathname
    const activeIndex = headerLinks.findIndex(
      (link) => currentPath === link.to || currentPath.startsWith(link.to + '/'),
    )
    return activeIndex !== -1 ? (refs[activeIndex] ?? null) : null
  }, [router.state.location.pathname, refs])

  useLayoutEffect(() => {
    const updatePosition = () => {
      if (activeLinkRef?.current) {
        const left = activeLinkRef.current.offsetLeft + activeLinkRef.current.offsetWidth / 2 - 15
        setTriangleLeft(left)
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [activeLinkRef])

  return {
    refs,
    triangleLeft,
    activeLinkRef,
  }
}
