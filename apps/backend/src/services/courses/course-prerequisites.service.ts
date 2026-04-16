import { eq } from 'drizzle-orm'
import { db, payloadDb } from '../../db'
import { user } from '../../db/auth-schema'
import { CourseCompletionService } from './course-completion.service'

export interface CourseAccessAllowed {
  allowed: true
}

export interface CourseAccessDenied {
  allowed: false
  prerequisiteCourseSlug: string
  prerequisiteCourseTitle: string
}

export type CourseAccessResult = CourseAccessAllowed | CourseAccessDenied

export class CoursePrerequisitesService {
  /**
   * Checks if the user has access to a course (prerequisite met or bypassed).
   * Always allowed for unauthenticated users (handled at the route level).
   */
  static async checkCourseAccess(userId: string, courseSlug: string): Promise<CourseAccessResult> {
    const course = await payloadDb.query.courses.findFirst({
      where: (c, { eq: eqFn }) => eqFn(c.slug, courseSlug),
      with: { prerequisiteCourse: true },
    })

    if (!course) return { allowed: true }

    const prereq = course.prerequisiteCourse
    if (!prereq || typeof prereq !== 'object') return { allowed: true }

    // Check if user has opted out of prerequisites
    const [userRow] = await db
      .select({ skipPrerequisites: user.skipPrerequisites })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (userRow?.skipPrerequisites) return { allowed: true }

    const prereqId = typeof prereq === 'object' ? (prereq as { id: number }).id : prereq
    const prereqSlug = typeof prereq === 'object' ? (prereq as { slug?: string | null }).slug ?? '' : ''
    const prereqTitle = typeof prereq === 'object' ? (prereq as { title?: string }).title ?? prereqSlug : prereqSlug

    const completed = await CourseCompletionService.isCompletedByUser(userId, prereqId)

    if (completed) return { allowed: true }

    return {
      allowed: false,
      prerequisiteCourseSlug: prereqSlug,
      prerequisiteCourseTitle: prereqTitle,
    }
  }

  /**
   * Returns a map of courseSlug → lock status for all given slugs.
   * Unauthenticated (no userId) → all unlocked.
   */
  static async getCourseAccessMap(
    userId: string | null,
    courses: Array<{ id: number; slug: string | null; prerequisiteCourse?: unknown }>,
  ): Promise<Map<string, { locked: boolean; prerequisiteCourseSlug?: string }>> {
    const result = new Map<string, { locked: boolean; prerequisiteCourseSlug?: string }>()

    if (!userId) {
      for (const c of courses) {
        if (c.slug) result.set(c.slug, { locked: false })
      }
      return result
    }

    // Check if user skips prerequisites
    const [userRow] = await db
      .select({ skipPrerequisites: user.skipPrerequisites })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (userRow?.skipPrerequisites) {
      for (const c of courses) {
        if (c.slug) result.set(c.slug, { locked: false })
      }
      return result
    }

    for (const c of courses) {
      if (!c.slug) continue
      const prereq = c.prerequisiteCourse
      if (!prereq || typeof prereq !== 'object') {
        result.set(c.slug, { locked: false })
        continue
      }

      const prereqId = (prereq as { id: number }).id
      const prereqSlug = (prereq as { slug?: string | null }).slug ?? ''
      const completed = await CourseCompletionService.isCompletedByUser(userId, prereqId)
      result.set(c.slug, { locked: !completed, prerequisiteCourseSlug: prereqSlug })
    }

    return result
  }
}
