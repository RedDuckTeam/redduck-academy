import { useEffect, useRef, useState } from 'react'
import type { Lesson } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { TableOfContentsIcon } from '@/components/ui/icons/table-of-contents'
import { cn } from '@/lib/utils'
import { useToc } from './use-toc'
import { lessonRouteApi } from '@/lib/routes/lesson-route'
import { scrollToHeading } from './scroll-to-heading'

interface LessonTocProps {
  lesson: Lesson
}

const SCROLL_OFFSET = 80

export function LessonToc({ lesson }: LessonTocProps) {
  const { lessonBody } = lessonRouteApi.useLoaderData()
  const { items, activeId } = useToc(lesson, lessonBody)

  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>())
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null)

  useEffect(() => {
    if (!activeId) {
      setIndicator(null)
      return
    }
    const measure = () => {
      const anchor = itemRefs.current.get(activeId)
      const container = containerRef.current
      if (!anchor || !container) {
        setIndicator(null)
        return
      }
      const aRect = anchor.getBoundingClientRect()
      const cRect = container.getBoundingClientRect()
      setIndicator({
        top: aRect.top - cRect.top + container.scrollTop,
        height: aRect.height,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeId, items])

  if (items.length === 0) return null

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    scrollToHeading(id, SCROLL_OFFSET)
  }

  return (
    <nav aria-label="On this page" className="hidden xl:flex w-[300px] shrink-0 self-start sticky top-5 max-h-[calc(100vh-40px)] flex-col bg-sidebar overflow-hidden">
      <div className="flex h-[60px] shrink-0 items-center gap-5 border-b border-border px-5">
        <TableOfContentsIcon className="size-5 shrink-0 text-[#e0deda]" />
        <Text variant="caps-20" className="truncate text-[#e0deda]">
          Table of Contents
        </Text>
      </div>
      <div ref={containerRef} className="relative flex-1 overflow-y-auto py-3">
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute left-0 h-0 w-0 border-solid',
            'border-b-12 border-l-12 border-r-0 border-t-12',
            'border-b-transparent border-l-primary border-r-transparent border-t-transparent',
            'transition-all duration-300 ease-out',
            indicator ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            top: indicator ? indicator.top + indicator.height / 2 - 12 : 0,
          }}
        />
        <ul className="flex flex-col">
          {items.map((item) => {
            const isActive = item.id === activeId
            return (
              <li key={item.id} style={{ paddingLeft: 20 + (item.level - 1) * 16 }} className="pr-5">
                <a
                  ref={(el) => {
                    if (el) itemRefs.current.set(item.id, el)
                    else itemRefs.current.delete(item.id)
                  }}
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={cn(
                    'block py-2 font-ibm-plex-mono text-[16px] leading-[20px] transition-colors duration-200',
                    isActive ? 'text-[#e0deda]' : 'text-[#e0deda]/60 hover:text-[#e0deda]',
                  )}
                >
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
