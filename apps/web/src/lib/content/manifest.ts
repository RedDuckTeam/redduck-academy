import type { Course, Lesson } from '@/types/lesson'
import { COURSES_INDEX_ASSET, courseManifestPath } from './paths'
import { fetchContentAsset } from './asset-fetch'

// Runtime readers for the structure manifests emitted by the `content-assets` Vite plugin.
// These let the app render the whole program and any lecture with no backend.
//
// Loading discipline (keep the app fast): opening a lesson loads ONLY that lesson's course
// manifest — never the whole program. The parsed result is memoized at module scope, so on
// the Worker it is fetched + parsed once per isolate (until the next deploy) and reused
// across requests, and on the client once per session. Failures are not cached, so a
// transient miss can retry.

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

/** Every course, structure only (no lesson prose or faq). For the program/index pages. */
export function loadCoursesManifest(): Promise<Course[] | null> {
  // In dev, always read fresh so content edits show on reload; the manifest changes only
  // on a rebuild in prod, where memoizing per isolate is the point.
  if (import.meta.env.DEV) return fetchJson<Course[]>(COURSES_INDEX_ASSET)
  return (coursesPromise ??= fetchJson<Course[]>(COURSES_INDEX_ASSET).then((v) => {
    if (v == null) coursesPromise = null
    return v
  }))
}

/** One course's structure, including per-lesson faq. For a lesson page (that course only). */
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

/** Find a lesson within an already-loaded course manifest, by slug. */
export function findLessonInCourse(course: Course | null, lessonSlug: string): Lesson | null {
  if (!course) return null
  for (const module of course.modules) {
    const lesson = module.lessons.find((l) => l.slug === lessonSlug)
    if (lesson) return lesson
  }
  return null
}
