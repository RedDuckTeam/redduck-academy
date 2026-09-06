// Unsaved editor buffers live in IndexedDB rather than localStorage: localStorage is synchronous
// and a lesson file is tens of kilobytes, so every autosave would block the main thread mid-keystroke.
// Writes are started from `visibilitychange`, which is the last event a mobile browser reliably
// fires — `beforeunload` needs sticky activation, is skipped on mobile, and disqualifies the page
// from bfcache in Firefox.

const DB_NAME = 'redduck-lesson-editor'
const DB_VERSION = 1
const STORE = 'drafts'

export interface LessonDraft {
  key: string
  /** The whole file, frontmatter included. */
  content: string
  /** The hash the draft was started from, restored with it so a stale draft still gets its 409. */
  baseHash: string
  savedAt: number
}

export function draftKey(courseSlug: string, moduleSlug: string, lessonSlug: string): string {
  return `${courseSlug}/${moduleSlug}/${lessonSlug}`
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB unavailable'))
    request.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab'))
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode)
      const request = run(transaction.objectStore(STORE))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
    })
  } finally {
    db.close()
  }
}

// Storage is a convenience, never a precondition for editing: private-mode Safari, a disabled
// origin and a full quota all throw, and in every case the buffer in memory is still the truth.

export async function loadDraft(key: string): Promise<LessonDraft | null> {
  try {
    const row = await withStore<LessonDraft | undefined>('readonly', (store) => store.get(key))
    return row ?? null
  } catch {
    return null
  }
}

export async function saveDraft(draft: LessonDraft): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.put(draft))
  } catch {
    /* keep typing */
  }
}

export async function deleteDraft(key: string): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(key))
  } catch {
    /* keep typing */
  }
}
