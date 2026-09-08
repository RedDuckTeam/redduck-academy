import type { Course, Lesson } from '@/types/lesson'
import { COURSES_INDEX_ASSET, courseManifestPath } from './paths'
import { fetchContentAsset } from './asset-fetch'

let coursesPromise: Promise<Course[] | null> | null = null
const courseBySlug = new Map<string, Promise<Course | null>>()

async function fetchJson<T>(assetPath: string): Promise<T | null> {
  const res = await fetchContentAsset(assetPath)
  if (!res || !res.ok) return null
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

export function loadCoursesManifest(): Promise<Course[] | null> {
  if (import.meta.env.DEV) return fetchJson<Course[]>(COURSES_INDEX_ASSET)
  return (coursesPromise ??= fetchJson<Course[]>(COURSES_INDEX_ASSET).then((v) => {
    if (v == null) coursesPromise = null
    return v
  }))
}

export function loadCourseManifest(courseSlug: string): Promise<Course | null> {
  if (import.meta.env.DEV) return fetchJson<Course>(courseManifestPath(courseSlug))
  const cached = courseBySlug.get(courseSlug)
  if (cached) return cached
  const promise = fetchJson<Course>(courseManifestPath(courseSlug)).then((v) => {
    if (v == null) courseBySlug.delete(courseSlug)
    return v
  })
  courseBySlug.set(courseSlug, promise)
  return promise
}

export function findLessonInCourse(course: Course | null, lessonSlug: string): Lesson | null {
  if (!course) return null
  for (const module of course.modules) {
    const lesson = module.lessons.find((l) => l.slug === lessonSlug)
    if (lesson) return lesson
  }
  return null
}
