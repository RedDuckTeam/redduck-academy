// Imported by vite.config.ts, which loads before the tsconfig-paths alias exists: keep this
// Node-only, relative imports and `yaml` only, no `@/` alias and no browser/React code.

import fs from 'node:fs/promises'
import path from 'node:path'
import yaml from 'yaml'

const FRONTMATTER_CAPTURE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export interface ManifestFaqItem {
  question: string
  answer: string
}

export interface ManifestLesson {
  id: number
  title: string
  slug: string
  moduleId: number
  order: number
  type: string
  next: string | null
  updatedAt: string
  createdAt: string
  faq?: ManifestFaqItem[] | null
}

export interface ManifestModule {
  id: number
  title: string
  slug: string
  courseId: number
  order: number
  updatedAt: string
  createdAt: string
  lessons: ManifestLesson[]
}

export interface ManifestCourse {
  id: number
  title: string
  slug: string
  description: string
  updatedAt: string
  createdAt: string
  prerequisiteCourse: { id: number; slug: string; title: string } | null
  modules: ManifestModule[]
}

interface RawFile {
  data: Record<string, unknown>
  body: string
  mtime: string
}

// Negative so a placeholder id can never collide with a real Payload row id.
function syntheticId(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return -Math.abs(h) - 1
}

function isHidden(data: Record<string, unknown>): boolean {
  return data.isHidden === true
}

async function readFrontmatter(abs: string): Promise<RawFile> {
  const raw = await fs.readFile(abs, 'utf8')
  const stat = await fs.stat(abs)
  const mtime = stat.mtime.toISOString()
  const m = raw.match(FRONTMATTER_CAPTURE)
  if (!m) return { data: {}, body: raw, mtime }
  const data = (yaml.parse(m[1]) ?? {}) as Record<string, unknown>
  return { data, body: raw.slice(m[0].length), mtime }
}

async function listDirs(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(path.join(dir, e.name))
  }
  return out.sort()
}

async function listLessonFiles(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('_')) out.push(path.join(dir, e.name))
  }
  return out.sort()
}

export async function buildContentTree(contentDir: string): Promise<ManifestCourse[]> {
  const courses: ManifestCourse[] = []
  const prereqSlugByCourseSlug = new Map<string, string>()

  for (const courseDir of await listDirs(contentDir)) {
    const courseSlug = path.basename(courseDir)
    let courseMeta: RawFile
    try {
      courseMeta = await readFrontmatter(path.join(courseDir, '_course.md'))
    } catch {
      continue
    }
    if (isHidden(courseMeta.data)) continue

    const courseId = typeof courseMeta.data.id === 'number' ? courseMeta.data.id : syntheticId(courseSlug)
    const prereq = courseMeta.data.prerequisiteCourse
    if (typeof prereq === 'string' && prereq) prereqSlugByCourseSlug.set(courseSlug, prereq)

    const modules: ManifestModule[] = []
    for (const moduleDir of await listDirs(courseDir)) {
      const moduleSlug = path.basename(moduleDir)
      let moduleMeta: RawFile
      try {
        moduleMeta = await readFrontmatter(path.join(moduleDir, '_module.md'))
      } catch {
        continue
      }
      if (isHidden(moduleMeta.data)) continue

      const moduleId =
        typeof moduleMeta.data.id === 'number' ? moduleMeta.data.id : syntheticId(`${courseSlug}/${moduleSlug}`)

      const lessons: ManifestLesson[] = []
      for (const lessonFile of await listLessonFiles(moduleDir)) {
        const lessonSlug = path.basename(lessonFile, '.md')
        const meta = await readFrontmatter(lessonFile)
        if (isHidden(meta.data)) continue

        const faq = Array.isArray(meta.data.faq)
          ? (meta.data.faq as unknown[])
              .map((row) => row as Record<string, unknown>)
              .filter((row) => typeof row?.question === 'string' && typeof row?.answer === 'string')
              .map((row) => ({ question: row.question as string, answer: row.answer as string }))
          : null

        lessons.push({
          id:
            typeof meta.data.id === 'number' ? meta.data.id : syntheticId(`${courseSlug}/${moduleSlug}/${lessonSlug}`),
          title: typeof meta.data.title === 'string' ? meta.data.title : lessonSlug,
          slug: lessonSlug,
          moduleId,
          order: typeof meta.data.order === 'number' ? meta.data.order : 0,
          type: typeof meta.data.type === 'string' ? meta.data.type : 'lecture',
          next: null,
          updatedAt: meta.mtime,
          createdAt: meta.mtime,
          faq: faq && faq.length ? faq : null,
        })
      }
      lessons.sort((a, b) => a.order - b.order)

      modules.push({
        id: moduleId,
        title: typeof moduleMeta.data.title === 'string' ? moduleMeta.data.title : moduleSlug,
        slug: moduleSlug,
        courseId,
        order: typeof moduleMeta.data.order === 'number' ? moduleMeta.data.order : 0,
        updatedAt: moduleMeta.mtime,
        createdAt: moduleMeta.mtime,
        lessons,
      })
    }
    modules.sort((a, b) => a.order - b.order)

    const flat = modules.flatMap((m) => m.lessons)
    flat.forEach((lesson, i) => {
      lesson.next = i + 1 < flat.length ? flat[i + 1].slug : null
    })

    courses.push({
      id: courseId,
      title: typeof courseMeta.data.title === 'string' ? courseMeta.data.title : courseSlug,
      slug: courseSlug,
      description: courseMeta.body.trim(),
      updatedAt: courseMeta.mtime,
      createdAt: courseMeta.mtime,
      prerequisiteCourse: null,
      modules,
      ...(typeof courseMeta.data.order === 'number' ? { order: courseMeta.data.order } : {}),
    } as ManifestCourse & { order?: number })
  }

  courses.sort((a, b) => ((a as { order?: number }).order ?? 0) - ((b as { order?: number }).order ?? 0))

  const bySlug = new Map(courses.map((c) => [c.slug, c]))
  for (const course of courses) {
    const prereqSlug = prereqSlugByCourseSlug.get(course.slug)
    const target = prereqSlug ? bySlug.get(prereqSlug) : undefined
    if (target) course.prerequisiteCourse = { id: target.id, slug: target.slug, title: target.title }
  }

  for (const course of courses) delete (course as { order?: number }).order
  return courses
}

export function coursesIndexJson(tree: ManifestCourse[]): string {
  const stripped = tree.map((course) => ({
    ...course,
    modules: course.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map(({ faq, ...rest }) => rest),
    })),
  }))
  return JSON.stringify(stripped)
}

/** faq is ~85% of the payload and only the current lesson's is ever used, so it is stripped here
 *  and parsed from that lesson's own `.md` at request time instead (see loadLessonContent). */
export function courseManifestJson(course: ManifestCourse): string {
  return JSON.stringify({
    ...course,
    modules: course.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map(({ faq, ...rest }) => rest),
    })),
  })
}
