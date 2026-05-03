import type { ListViewServerProps, Payload, TypedUser } from 'payload'
import { Gutter } from '@payloadcms/ui'
import { HierarchyTree } from './tree-view'
import type { CourseNode, LessonNode, ModuleNode, TreeMode } from './types'
import './lessons-tree.scss'

async function fetchTreeData(payload: Payload, user: TypedUser | undefined) {
  const [coursesRes, modulesRes, lessonsRes] = await Promise.all([
    payload.find({
      collection: 'courses',
      limit: 1000,
      sort: 'order',
      depth: 0,
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'modules',
      limit: 1000,
      sort: 'order',
      depth: 0,
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'lessons',
      limit: 5000,
      sort: 'order',
      depth: 0,
      overrideAccess: false,
      user,
    }),
  ])

  const courses: CourseNode[] = coursesRes.docs.map((c) => ({
    id: c.id,
    title: c.title,
    isHidden: Boolean(c.isHidden),
    order: c.order ?? 0,
  }))

  const modules: ModuleNode[] = modulesRes.docs.map((m) => ({
    id: m.id,
    title: m.title,
    courseId: typeof m.course === 'object' && m.course ? m.course.id : (m.course as number),
    isHidden: Boolean(m.isHidden),
    order: m.order ?? 0,
  }))

  const lessons: LessonNode[] = lessonsRes.docs.map((l) => ({
    id: l.id,
    title: l.title,
    moduleId: typeof l.module === 'object' && l.module ? l.module.id : (l.module as number),
    type: l.type,
    isHidden: Boolean(l.isHidden),
    order: l.order ?? 0,
  }))

  return { courses, modules, lessons }
}

async function renderView(mode: TreeMode, props: ListViewServerProps) {
  const { courses, modules, lessons } = await fetchTreeData(props.payload, props.user)
  return (
    <Gutter className="lessons-tree-view">
      <HierarchyTree mode={mode} courses={courses} modules={modules} lessons={lessons} />
    </Gutter>
  )
}

export async function CoursesTreeView(props: ListViewServerProps) {
  return renderView('courses', props)
}

export async function ModulesTreeView(props: ListViewServerProps) {
  return renderView('modules', props)
}

export async function LessonsTreeView(props: ListViewServerProps) {
  return renderView('lessons', props)
}
