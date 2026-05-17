import { useCallback, useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmbedFrameProps {
  src: string
  title: string
  className?: string
  iframeClassName?: string
}

export function EmbedFrame({ src, title, className, iframeClassName }: EmbedFrameProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false)
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false)

  const isFullscreen = isNativeFullscreen || isFallbackFullscreen

  useEffect(() => {
    const onChange = () => {
      setIsNativeFullscreen(document.fullscreenElement === wrapperRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    if (!isFallbackFullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFallbackFullscreen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isFallbackFullscreen])

  const toggle = useCallback(async () => {
    const el = wrapperRef.current
    if (!el) return
    if (isNativeFullscreen) {
      await document.exitFullscreen().catch(() => undefined)
      return
    }
    if (isFallbackFullscreen) {
      setIsFallbackFullscreen(false)
      return
    }
    if (typeof el.requestFullscreen === 'function') {
      try {
        await el.requestFullscreen()
        return
      } catch {
        // fall through to CSS fallback
      }
    }
    setIsFallbackFullscreen(true)
  }, [isNativeFullscreen, isFallbackFullscreen])

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative w-full overflow-hidden rounded-xl my-4 bg-black',
        !isFullscreen && 'aspect-[9/13] md:aspect-video',
        isFallbackFullscreen && 'fixed inset-0 z-[100] my-0 rounded-none',
        isNativeFullscreen && 'h-full rounded-none',
        className,
      )}
    >
      <iframe
        src={src}
        title={title}
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        allow="fullscreen"
        className={cn('h-full w-full', iframeClassName)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Expand to fullscreen'}
        className="absolute top-2 right-2 z-10 flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        <span>{isFullscreen ? 'Exit' : 'Expand'}</span>
      </button>
    </div>
  )
}
