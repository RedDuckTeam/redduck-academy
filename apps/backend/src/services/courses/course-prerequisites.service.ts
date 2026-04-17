import { and, eq, inArray, ne } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { user } from '../../db/auth-schema'
import { userLessons } from '../../db/schema'

export interface CourseAccessAllowed {
  allowed: true
}

export interface CourseAccessDenied {
  allowed: false
  prerequisiteCourseSlug: string
  prerequisiteCourseTitle: string
}

export type CourseAccessResult = CourseAccessAllowed | CourseAccessDenied

type AccessMapEntry = { locked: boolean; prerequisiteCourseSlug?: string; prerequisiteCourseTitle?: string }

async function fetchUserSkipPrerequisites(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ skipPrerequisites: user.skipPrerequisites })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  return row?.skipPrerequisites ?? false
}

/** Fetches graded (non-lecture) lesson IDs for a course, keyed by courseId. */
async function fetchGradedLessonIdsByCourseId(courseIds: number[]): Promise<Map<number, Set<number>>> {
  const courses = await payloadDb.query.courses.findMany({
    where: (c, { inArray: inArr }) => inArr(c.id, courseIds),
    columns: { id: true },
    with: {
      modules: {
        where: (m) => ne(m.isHidden, true),
        with: {
          lessons: {
            where: (l) => ne(l.isHidden, true),
            columns: { id: true, type: true },
          },
        },
      },
    },
  })

  const map = new Map<number, Set<number>>()
  for (const course of courses) {
    const ids = new Set(
      (course.modules ?? [])
        .flatMap((m) => m.lessons ?? [])
        .filter((l) => l.type !== 'lecture')
        .map((l) => l.id),
    )
    map.set(course.id, ids)
  }
  return map
}

/** Returns the set of completed lesson IDs for a user from the given candidate IDs. */
async function fetchCompletedLessonIds(userId: string, lessonIds: number[]): Promise<Set<number>> {
  if (lessonIds.length === 0) return new Set()
  const rows = await db
    .select({ lessonId: userLessons.lessonId })
    .from(userLessons)
    .where(
      and(eq(userLessons.userId, userId), eq(userLessons.isCompleted, true), inArray(userLessons.lessonId, lessonIds)),
    )
  return new Set(rows.map((r) => r.lessonId))
}

export class CoursePrerequisitesService {
  /**
   * Checks if the user has access to a course (prerequisite met or bypassed).
   * Always allowed for unauthenticated users (handled at the route level).
   *
   * Queries: 1 (course + prereq lessons) + 1 (skipPrerequisites) + 1 (completed lessons) = 3 max
   */
  static async checkCourseAccess(userId: string, courseSlug: string): Promise<CourseAccessResult> {
    const course = await payloadDb.query.courses.findFirst({
      where: (c, { eq: eqFn }) => eqFn(c.slug, courseSlug),
      with: {
        prerequisiteCourse: {
          columns: { id: true, slug: true, title: true },
          with: {
            modules: {
              where: (m) => ne(m.isHidden, true),
              with: {
                lessons: {
                  where: (l) => ne(l.isHidden, true),
                  columns: { id: true, type: true },
                },
              },
            },
          },
        },
      },
    })

    if (!course) return { allowed: true }

    const prereq = course.prerequisiteCourse

    if (!prereq) return { allowed: true }

    if (await fetchUserSkipPrerequisites(userId)) return { allowed: true }

    const prereqSlug = prereq.slug!
    const prereqTitle = prereq.title!

    const gradedIds = prereq.modules?.flatMap((m) => m.lessons?.map((l) => l.id) ?? []) ?? []

    if (gradedIds.length === 0) return { allowed: true }

    const completedIds = await fetchCompletedLessonIds(userId, gradedIds)
    if (gradedIds.every((id) => completedIds.has(id))) return { allowed: true }

    return { allowed: false, prerequisiteCourseSlug: prereqSlug, prerequisiteCourseTitle: prereqTitle }
  }

  /**
   * Returns a map of courseSlug → lock status for all given courses.
   * Unauthenticated (no userId) → all unlocked.
   *
   * Queries: 1 (skipPrerequisites) + 1 (all prereq lessons) + 1 (completed lessons) = 3 max
   */
  static async getCourseAccessMap(
    userId: string | null,
    courses: Array<{ id: number; slug: string | null; prerequisiteCourse?: unknown }>,
  ): Promise<Map<string, AccessMapEntry>> {
    const result = new Map<string, AccessMapEntry>()

    const allUnlocked = () => {
      for (const c of courses) if (c.slug) result.set(c.slug, { locked: false })
      return result
    }

    if (!userId) return allUnlocked()
    if (await fetchUserSkipPrerequisites(userId)) return allUnlocked()

    // Collect unique prereq course IDs
    const prereqCourseIds = new Set<number>()
    for (const c of courses) {
      const prereq = c.prerequisiteCourse as { id?: number } | null | undefined
      if (prereq?.id) prereqCourseIds.add(prereq.id)
    }

    const gradedLessonsByCourseId =
      prereqCourseIds.size > 0
        ? await fetchGradedLessonIdsByCourseId([...prereqCourseIds])
        : new Map<number, Set<number>>()

    const allGradedIds = [...gradedLessonsByCourseId.values()].flatMap((s) => [...s])
    const completedIds = await fetchCompletedLessonIds(userId, allGradedIds)

    for (const c of courses) {
      if (!c.slug) continue
      const prereq = c.prerequisiteCourse as { id?: number; slug?: string | null; title?: string } | null | undefined
      if (!prereq?.id) {
        result.set(c.slug, { locked: false })
        continue
      }

      const gradedIds = gradedLessonsByCourseId.get(prereq.id)
      if (!gradedIds || gradedIds.size === 0) {
        result.set(c.slug, { locked: false })
        continue
      }

      const prereqSlug = prereq.slug ?? ''
      const prereqTitle = prereq.title ?? prereqSlug
      const locked = ![...gradedIds].every((id) => completedIds.has(id))
      result.set(c.slug, { locked, prerequisiteCourseSlug: prereqSlug, prerequisiteCourseTitle: prereqTitle })
    }

    return result
  }
}
