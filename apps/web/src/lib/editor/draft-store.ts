const KEY_PREFIX = 'redduck-lesson-draft:'

export interface LessonDraft {
  key: string
  /** The whole file, frontmatter included. */
  content: string
  /** The published file this draft started from — freshness is checked against this, not the current file. */
  baseline: string
  savedAt: number
}

/** A draft on its way to storage: the timestamp is stamped when it lands, not when it is built. */
export type PendingDraft = Omit<LessonDraft, 'savedAt'>

export function draftKey(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `${courseSlug}/${moduleSlug}/${lessonSlug}`
}

// Storage is a convenience, never a precondition for editing: private-mode Safari, a disabled
// origin and a full quota all throw, and in every case the buffer in memory is still the truth.

export function loadDraft(key: string): LessonDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LessonDraft
    return typeof parsed?.content === 'string' ? parsed : null
  } catch {
    return null
  }
}

export function saveDraft(draft: LessonDraft): void {
  try {
    sessionStorage.setItem(KEY_PREFIX + draft.key, JSON.stringify(draft))
  } catch {}
}

export function deleteDraft(key: string): void {
  try {
    sessionStorage.removeItem(KEY_PREFIX + key)
  } catch {}
}
