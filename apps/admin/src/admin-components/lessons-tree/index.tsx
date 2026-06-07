import type { ListViewServerProps, Payload, TypedUser } from 'payload'
import { Gutter } from '@payloadcms/ui'
import { HierarchyTree } from './tree-view'
import type { CourseNode, LessonNode, ModuleNode, TreeMode } from './types'
import { withDbRecovery } from '../../lib/db-recovery'
import './lessons-tree.scss'

/**
 * Loads the three collections that make up the tree. Each query runs through
 * `withDbRecovery` (so a transient "too many connections" self-heals) and the
 * results are gathered with `allSettled` — if one collection fails we still
 * render the rest instead of blanking the whole admin view. `degraded` flags a
 * partial load so the UI can warn the editor. See RESILIENCE-AUDIT.md → C4.
 */
async function fetchTreeData(payload: Payload, user: TypedUser | undefined) {
  const [coursesRes, modulesRes, lessonsRes] = await Promise.allSettled([
    withDbRecovery(payload, () =>
      payload.find({ collection: 'courses', limit: 1000, sort: 'order', depth: 0, overrideAccess: false, user }),
    ),
    withDbRecovery(payload, () =>
      payload.find({ collection: 'modules', limit: 1000, sort: 'order', depth: 0, overrideAccess: false, user }),
    ),
    withDbRecovery(payload, () =>
      payload.find({ collection: 'lessons', limit: 5000, sort: 'order', depth: 0, overrideAccess: false, user }),
    ),
  ])

  const degraded =
    coursesRes.status === 'rejected' ||
    modulesRes.status === 'rejected' ||
    lessonsRes.status === 'rejected'

  for (const res of [coursesRes, modulesRes, lessonsRes]) {
    if (res.status === 'rejected') {
      payload.logger.error({ err: res.reason }, 'Failed to load a collection for the lessons tree view')
    }
  }

  const courses: CourseNode[] =
    coursesRes.status === 'fulfilled'
      ? coursesRes.value.docs.map((c) => ({
          id: c.id as number,
          title: c.title,
          isHidden: Boolean(c.isHidden),
          order: c.order ?? 0,
        }))
      : []

  const modules: ModuleNode[] =
    modulesRes.status === 'fulfilled'
      ? modulesRes.value.docs.map((m) => ({
          id: m.id as number,
          title: m.title,
          courseId: typeof m.course === 'object' && m.course ? (m.course.id as number) : (m.course as number),
          isHidden: Boolean(m.isHidden),
          order: m.order ?? 0,
        }))
      : []

  const lessons: LessonNode[] =
    lessonsRes.status === 'fulfilled'
      ? lessonsRes.value.docs.map((l) => ({
          id: l.id as number,
          title: l.title,
          moduleId: typeof l.module === 'object' && l.module ? (l.module.id as number) : (l.module as number),
          type: l.type,
          isHidden: Boolean(l.isHidden),
          order: l.order ?? 0,
        }))
      : []

  return { courses, modules, lessons, degraded }
}

function TreeLoadError() {
  return (
    <Gutter className="lessons-tree-view">
      <div className="lessons-tree-error" role="alert">
        <h3>Couldn&apos;t load the content tree</h3>
        <p>The database is busy right now. Reload the page to try again — your content is safe.</p>
      </div>
    </Gutter>
  )
}

async function renderView(mode: TreeMode, props: ListViewServerProps) {
  let data: Awaited<ReturnType<typeof fetchTreeData>>
  try {
    data = await fetchTreeData(props.payload, props.user)
  } catch (err) {
    // Recovery already retried; a throw here means it's still failing. Degrade
    // to a friendly message instead of letting the server component blow up the
    // whole admin route.
    props.payload.logger.error({ err }, 'Lessons tree view failed to render')
    return <TreeLoadError />
  }

  return (
    <Gutter className="lessons-tree-view">
      {data.degraded && (
        <div className="lessons-tree-warning" role="alert">
          Some content failed to load. Reload to see the full tree.
        </div>
      )}
      <HierarchyTree mode={mode} courses={data.courses} modules={data.modules} lessons={data.lessons} />
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
