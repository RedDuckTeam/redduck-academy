import { useEffect, useMemo, useRef, useState } from 'react'
import type { Lesson } from '@/types/lesson'
import { Text, textVariants } from '@/components/ui/text'
import { TableOfContentsIcon } from '@/components/ui/icons/table-of-contents'
import { ArrowRight } from '@/components/ui/icons/arrow-right'
import { cn } from '@/lib/utils'
import { buildTocItems } from './build-toc-items'
import { useActiveHeading } from './use-active-heading'

interface MobileTocProps {
  lesson: Lesson
}

const SCROLL_OFFSET = 160

export function MobileToc({ lesson }: MobileTocProps) {
  const items = useMemo(() => buildTocItems(lesson), [lesson])
  const ids = useMemo(() => items.map((i) => i.id), [items])
  const activeId = useActiveHeading(ids)
  const activeItem = items.find((i) => i.id === activeId)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  if (items.length === 0) return null

  const scrollToId = (id: string, attempt = 0) => {
    const el = document.getElementById(id)
    if (!el) {
      if (attempt < 5) requestAnimationFrame(() => scrollToId(id, attempt + 1))
      return
    }
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
    history.replaceState(null, '', `#${id}`)
  }

  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setIsOpen(false)
    scrollToId(id)
  }

  return (
    <div ref={containerRef} className="md:hidden sticky top-[60px] z-30 -mx-5">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="flex h-[48px] w-full items-center gap-3 border-y border-border bg-sidebar px-5"
      >
        <TableOfContentsIcon className="size-4 shrink-0 text-[#e0deda]" />
        <Text variant="main-14" className="shrink-0 text-[#e0deda]">
          Table of Contents
        </Text>
        {activeItem && (
          <>
            <ArrowRight className="size-4 shrink-0 [&_path]:fill-secondary" />
            <Text variant="main-14" className="min-w-0 truncate text-[#e0deda]">
              {activeItem.label}
            </Text>
          </>
        )}
      </button>
      {isOpen && (
        <div className="absolute inset-x-0 top-full max-h-[60vh] overflow-y-auto border-b border-border bg-sidebar">
          <ul className="flex flex-col py-3">
            {items.map((item) => {
              const isActive = item.id === activeId
              return (
                <li key={item.id} style={{ paddingLeft: 20 + (item.level - 1) * 16 }} className="pr-5">
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleItemClick(e, item.id)}
                    className={cn(
                      textVariants({ variant: 'caps-14' }),
                      'block border-l-2 py-2 pl-3 transition-colors duration-200',
                      isActive
                        ? 'border-primary text-[#e0deda]'
                        : 'border-transparent text-[#e0deda]/60 hover:text-[#e0deda]',
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
