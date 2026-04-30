import { useMemo } from 'react'
import type { Lesson } from '@/types/lesson'
import { buildTocItems } from './build-toc-items'
import type { TocItem } from './build-toc-items'
import { useActiveHeading } from './use-active-heading'

export interface UseTocResult {
  items: TocItem[]
  activeId: string | null
  activeItem: TocItem | null
}

export function useToc(lesson: Lesson): UseTocResult {
  const items = useMemo(() => buildTocItems(lesson), [lesson])
  const ids = useMemo(() => items.map((i) => i.id), [items])
  const activeId = useActiveHeading(ids)
  const activeItem = useMemo(() => items.find((i) => i.id === activeId) ?? null, [items, activeId])
  return { items, activeId, activeItem }
}
