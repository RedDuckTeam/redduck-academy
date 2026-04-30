import { useEffect, useRef, useState } from 'react'
import type { Lesson } from '@/types/lesson'
import { Text, textVariants } from '@/components/ui/text'
import { TableOfContentsIcon } from '@/components/ui/icons/table-of-contents'
import { ArrowRight } from '@/components/ui/icons/arrow-right'
import { cn } from '@/lib/utils'
import { useToc } from './use-toc'
import { scrollToHeading } from './scroll-to-heading'

interface MobileTocProps {
  lesson: Lesson
}

const SCROLL_OFFSET = 160

export function MobileToc({ lesson }: MobileTocProps) {
  const { items, activeId, activeItem } = useToc(lesson)
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

  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setIsOpen(false)
    scrollToHeading(id, SCROLL_OFFSET)
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
                <li key={item.id} style={{ paddingLeft: 20 + (item.level - 1) * 12 }} className="relative pr-5">
                  {isActive && (
                    <span
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute left-1 top-1/2 -translate-y-1/2',
                        'h-0 w-0 border-solid border-b-[8px] border-l-[8px] border-r-0 border-t-[8px]',
                        'border-b-transparent border-l-primary border-r-transparent border-t-transparent',
                      )}
                    />
                  )}
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleItemClick(e, item.id)}
                    className={cn(
                      textVariants({ variant: 'caps-14' }),
                      'block py-2 transition-colors duration-200',
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
      )}
    </div>
  )
}
