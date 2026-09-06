// Unsaved editor buffers live in sessionStorage, which is scoped to the tab and cleared the moment
// it closes. That is the intended lifetime: a draft is a safety net for a reload or a stray click,
// not a document we keep on someone's machine after they have walked away.
//
// Writes are synchronous, which localStorage and IndexedDB are not. A lesson file is tens of
// kilobytes and the save is debounced, so the cost is nowhere near a frame; the flush on
// `visibilitychange` stays because that is the last event a mobile browser reliably fires.

const KEY_PREFIX = 'redduck-lesson-draft:'

export interface LessonDraft {
  key: string
  /** The whole file, frontmatter included. */
  content: string
  /**
   * The published file this draft was started from, restored with it: the freshness check asks
   * "did the lesson move since you began?", and the answer has to be measured against the text the
   * draft was written against, not against whatever is current now.
   */
  baseline?: string
  savedAt: number
}

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
  } catch {
    /* keep typing */
  }
}

export function deleteDraft(key: string): void {
  try {
    sessionStorage.removeItem(KEY_PREFIX + key)
  } catch {
    /* keep typing */
  }
}
