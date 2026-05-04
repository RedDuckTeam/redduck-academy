import { Link, useLocation } from '@tanstack/react-router'
import { useMemo } from 'react'
import { headerLinks } from '@/hooks/ui/useHeaderLinks'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { LessonSidebarList } from '@/components/pages/lesson/lesson-sidebar/lesson-sidebar-list'
import { DrawerClose } from '@/components/ui/drawer-menu'
import { HeaderMenuCoursesList } from '@/components/header/header-menu/header-menu-courses-list'
import { parseCoursesPathname } from '@/lib/routes/courses-pathname'

interface HeaderDrawerContentProps {
  open: boolean
  onSelect: () => void
}

export function HeaderDrawerContent({ open, onSelect }: HeaderDrawerContentProps) {
  const { pathname } = useLocation()
  const parsed = useMemo(() => parseCoursesPathname(pathname), [pathname])

  return (
    <div className="flex max-h-[min(712px,calc(100vh-60px))] w-full flex-col bg-[#000] overflow-y-auto">
      <nav className="flex shrink-0 flex-col divide-y divide-border border-b border-border">
        {headerLinks.map((link) => {
          return (
            <DrawerClose key={link.to} asChild>
              <Link to={link.to} className="block px-5 py-5">
                <Text variant="main-16" className={cn('font-ibm-plex-mono text-[#e0deda] uppercase tracking-normal')}>
                  {link.text}
                </Text>
              </Link>
            </DrawerClose>
          )
        })}
      </nav>

      {parsed.lessonSlug && parsed.moduleSlug && parsed.courseSlug && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <LessonSidebarList
            courseSlug={parsed.courseSlug}
            moduleSlug={parsed.moduleSlug}
            lessonSlug={parsed.lessonSlug}
            isLayoutActive={open}
            onSelect={onSelect}
          />
        </div>
      )}

      {parsed.courseSlug && !parsed.lessonSlug && (
        <HeaderMenuCoursesList open={open} courseSlug={parsed.courseSlug} onSelect={onSelect} />
      )}
    </div>
  )
}
