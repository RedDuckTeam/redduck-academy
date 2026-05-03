'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@payloadcms/ui'
import type { CourseNode, LessonNode, LessonType, ModuleNode, TreeMode } from './types'

interface HierarchyTreeProps {
  mode: TreeMode
  courses: CourseNode[]
  modules: ModuleNode[]
  lessons: LessonNode[]
}

const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  lecture: 'Lecture',
  test: 'Test',
  coding_task: 'Coding',
  review_task: 'Review',
}

const MODE_LABELS: Record<TreeMode, { title: string; singular: string; plural: string; collection: string }> = {
  courses: { title: 'Courses', singular: 'course', plural: 'courses', collection: 'courses' },
  modules: { title: 'Modules', singular: 'module', plural: 'modules', collection: 'modules' },
  lessons: { title: 'Lessons', singular: 'lesson', plural: 'lessons', collection: 'lessons' },
}

export function HierarchyTree({ mode, courses, modules, lessons }: HierarchyTreeProps) {
  const router = useRouter()
  const labels = MODE_LABELS[mode]
  const [search, setSearch] = useState('')
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(() =>
    mode === 'courses' ? new Set() : new Set(courses.map((c) => c.id)),
  )
  const [expandedModules, setExpandedModules] = useState<Set<number>>(() => new Set())
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  const query = search.trim().toLowerCase()

  // Visibility sets per level. `null` means "show all at this level".
  const visibility = useMemo(() => {
    if (!query) {
      return { courseIds: null as Set<number> | null, moduleIds: null as Set<number> | null, lessonIds: null as Set<number> | null }
    }

    if (mode === 'courses') {
      const courseIds = new Set(courses.filter((c) => c.title.toLowerCase().includes(query)).map((c) => c.id))
      return { courseIds, moduleIds: null, lessonIds: null }
    }

    if (mode === 'modules') {
      const moduleIds = new Set(modules.filter((m) => m.title.toLowerCase().includes(query)).map((m) => m.id))
      const courseIds = new Set<number>()
      for (const m of modules) if (moduleIds.has(m.id)) courseIds.add(m.courseId)
      return { courseIds, moduleIds, lessonIds: null }
    }

    // lessons
    const lessonIds = new Set(lessons.filter((l) => l.title.toLowerCase().includes(query)).map((l) => l.id))
    const moduleIds = new Set<number>()
    for (const l of lessons) if (lessonIds.has(l.id)) moduleIds.add(l.moduleId)
    const courseIds = new Set<number>()
    for (const m of modules) if (moduleIds.has(m.id)) courseIds.add(m.courseId)
    return { courseIds, moduleIds, lessonIds }
  }, [mode, query, courses, modules, lessons])

  const lessonsByModule = useMemo(() => {
    const map = new Map<number, LessonNode[]>()
    for (const l of lessons) {
      if (visibility.lessonIds && !visibility.lessonIds.has(l.id)) continue
      const arr = map.get(l.moduleId) ?? []
      arr.push(l)
      map.set(l.moduleId, arr)
    }
    return map
  }, [lessons, visibility.lessonIds])

  const modulesByCourse = useMemo(() => {
    const map = new Map<number, ModuleNode[]>()
    for (const m of modules) {
      const arr = map.get(m.courseId) ?? []
      arr.push(m)
      map.set(m.courseId, arr)
    }
    return map
  }, [modules])

  const isCourseExpanded = (id: number) =>
    visibility.courseIds ? visibility.courseIds.has(id) : expandedCourses.has(id)
  const isModuleExpanded = (id: number) =>
    visibility.moduleIds ? visibility.moduleIds.has(id) : expandedModules.has(id)

  const toggleCourse = (id: number) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleModule = (id: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    setExpandedCourses(new Set(courses.map((c) => c.id)))
    setExpandedModules(new Set(modules.map((m) => m.id)))
  }
  const collapseAll = () => {
    setExpandedCourses(new Set())
    setExpandedModules(new Set())
  }

  const deleteItem = async (collection: 'courses' | 'modules' | 'lessons', id: number, title: string) => {
    if (!window.confirm(`Delete ${MODE_LABELS[collection].singular} "${title}"? This cannot be undone.`)) return
    const key = `${collection}:${id}`
    setDeletingKey(key)
    try {
      const res = await fetch(`/api/${collection}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success(`Deleted "${title}"`)
      router.refresh()
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDeletingKey(null)
    }
  }

  const visibleCourses = visibility.courseIds
    ? courses.filter((c) => visibility.courseIds!.has(c.id))
    : courses

  const matchCount =
    mode === 'courses'
      ? visibility.courseIds?.size
      : mode === 'modules'
        ? visibility.moduleIds?.size
        : visibility.lessonIds?.size

  return (
    <div className="lessons-tree">
      <header className="lessons-tree__header">
        <div className="lessons-tree__title-row">
          <h1>{labels.title}</h1>
          <Link
            href={`/admin/collections/${labels.collection}/create`}
            className="lessons-tree__create-btn"
          >
            Create new
          </Link>
        </div>
        <div className="lessons-tree__toolbar">
          <input
            type="search"
            className="lessons-tree__search"
            placeholder={`Search ${labels.plural} by title…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="lessons-tree__toolbar-actions">
            <button type="button" onClick={expandAll} className="lessons-tree__link-btn">
              Expand all
            </button>
            <span className="lessons-tree__sep">·</span>
            <button type="button" onClick={collapseAll} className="lessons-tree__link-btn">
              Collapse all
            </button>
            <Link href={`/admin/collections/${labels.collection}`} className="lessons-tree__link-btn">
              Table view
            </Link>
          </div>
        </div>
        {query && (
          <p className="lessons-tree__hint">
            {matchCount ?? 0} {matchCount === 1 ? labels.singular : labels.plural} match “{search}”
          </p>
        )}
      </header>

      {visibleCourses.length === 0 && (
        <p className="lessons-tree__empty">
          {query
            ? `No ${labels.plural} match your search.`
            : 'No courses yet. Create a course to get started.'}
        </p>
      )}

      {visibleCourses.map((course) => {
        const courseModules = modulesByCourse.get(course.id) ?? []
        const visibleModules = visibility.moduleIds
          ? courseModules.filter((m) => visibility.moduleIds!.has(m.id))
          : courseModules
        const courseExpanded = isCourseExpanded(course.id)
        const courseDeleting = deletingKey === `courses:${course.id}`
        return (
          <section
            key={course.id}
            className={`lessons-tree__course${course.isHidden ? ' is-hidden' : ''}`}
          >
            <div
              className="lessons-tree__course-header"
              role="button"
              tabIndex={0}
              onClick={() => toggleCourse(course.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleCourse(course.id)
                }
              }}
              aria-expanded={courseExpanded}
            >
              <span className="lessons-tree__chevron" aria-hidden="true">
                {courseExpanded ? '▾' : '▸'}
              </span>
              <Link
                href={`/admin/collections/courses/${course.id}`}
                className="lessons-tree__course-title"
                onClick={(e) => e.stopPropagation()}
              >
                {course.title}
              </Link>
              {course.isHidden && <span className="lessons-tree__badge is-muted">Hidden</span>}
              <span className="lessons-tree__count">
                {courseModules.length} module{courseModules.length === 1 ? '' : 's'}
              </span>
              {mode === 'courses' && (
                <div
                  className="lessons-tree__lesson-actions"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/admin/collections/courses/${course.id}`}
                    className="lessons-tree__action"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="lessons-tree__action lessons-tree__action--danger"
                    onClick={() => deleteItem('courses', course.id, course.title)}
                    disabled={courseDeleting}
                  >
                    {courseDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              )}
            </div>

            {courseExpanded && (
              <div className="lessons-tree__modules">
                {visibleModules.length === 0 && (
                  <p className="lessons-tree__empty lessons-tree__empty--nested">
                    No modules in this course.
                  </p>
                )}
                {visibleModules.map((mod) => {
                  const modLessons = lessonsByModule.get(mod.id) ?? []
                  const modExpanded = isModuleExpanded(mod.id)
                  const modDeleting = deletingKey === `modules:${mod.id}`
                  return (
                    <div
                      key={mod.id}
                      className={`lessons-tree__module${mod.isHidden ? ' is-hidden' : ''}`}
                    >
                      <div
                        className="lessons-tree__module-header"
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleModule(mod.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggleModule(mod.id)
                          }
                        }}
                        aria-expanded={modExpanded}
                      >
                        <span className="lessons-tree__chevron" aria-hidden="true">
                          {modExpanded ? '▾' : '▸'}
                        </span>
                        <Link
                          href={`/admin/collections/modules/${mod.id}`}
                          className="lessons-tree__module-title"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {mod.title}
                        </Link>
                        {mod.isHidden && <span className="lessons-tree__badge is-muted">Hidden</span>}
                        <span className="lessons-tree__count">
                          {modLessons.length} lesson{modLessons.length === 1 ? '' : 's'}
                        </span>
                        {mode === 'modules' && (
                          <div
                            className="lessons-tree__lesson-actions"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <Link
                              href={`/admin/collections/modules/${mod.id}`}
                              className="lessons-tree__action"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="lessons-tree__action lessons-tree__action--danger"
                              onClick={() => deleteItem('modules', mod.id, mod.title)}
                              disabled={modDeleting}
                            >
                              {modDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>

                      {modExpanded && (
                        <ul className="lessons-tree__lessons">
                          {modLessons.length === 0 && (
                            <li className="lessons-tree__empty lessons-tree__empty--nested">
                              No lessons in this module.
                            </li>
                          )}
                          {modLessons.map((lesson) => {
                            const lessonDeleting = deletingKey === `lessons:${lesson.id}`
                            return (
                              <li
                                key={lesson.id}
                                className={`lessons-tree__lesson${lesson.isHidden ? ' is-hidden' : ''}`}
                              >
                                <span className="lessons-tree__order">#{lesson.order}</span>
                                <Link
                                  href={`/admin/collections/lessons/${lesson.id}`}
                                  className="lessons-tree__lesson-title"
                                >
                                  {lesson.title}
                                </Link>
                                <span
                                  className={`lessons-tree__badge lessons-tree__badge--${lesson.type}`}
                                >
                                  {LESSON_TYPE_LABELS[lesson.type]}
                                </span>
                                {lesson.isHidden && (
                                  <span className="lessons-tree__badge is-muted">Hidden</span>
                                )}
                                {mode === 'lessons' && (
                                  <div className="lessons-tree__lesson-actions">
                                    <Link
                                      href={`/admin/collections/lessons/${lesson.id}`}
                                      className="lessons-tree__action"
                                    >
                                      Edit
                                    </Link>
                                    <button
                                      type="button"
                                      className="lessons-tree__action lessons-tree__action--danger"
                                      onClick={() => deleteItem('lessons', lesson.id, lesson.title)}
                                      disabled={lessonDeleting}
                                    >
                                      {lessonDeleting ? 'Deleting…' : 'Delete'}
                                    </button>
                                  </div>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
