const KEY_PREFIX = 'redduck-lesson-draft:'

export interface LessonDraft {
  key: string
  content: string
  baseline: string
  savedAt: number
}

export type PendingDraft = Omit<LessonDraft, 'savedAt'>

export function draftKey(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `${courseSlug}/${moduleSlug}/${lessonSlug}`
}

// Every storage call is wrapped: private-mode Safari, a disabled origin and a full quota all throw.

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
