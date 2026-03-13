import { useRouter } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

export const headerLinks = [
  {
    to: '/',
    text: 'MY PROGRESS',
  },
  {
    to: '/courses',
    text: 'COURSE PROGRAM',
  },
  {
    to: '/demo/start/api-request',
    text: 'RATING',
  },
]

export const useHeaderLinks = () => {
  const router = useRouter()
  const refs = useMemo(() => {
    return headerLinks.map(() => ({ current: null }) as unknown as React.RefObject<HTMLAnchorElement>)
  }, [])
  const [activeLinkRef, setActiveLinkRef] = useState<React.RefObject<HTMLAnchorElement> | null>(null)
  const [triangleLeft, setTriangleLeft] = useState<number>(0)

  useEffect(() => {
    const currentPath = router.state.location.pathname
    const activeIndex = headerLinks.findIndex((link) => link.to === currentPath)

    if (activeIndex !== -1 && refs[activeIndex]) {
      setActiveLinkRef(refs[activeIndex])
    } else {
      setActiveLinkRef(null)
    }
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
