import { useEffect, useRef, useState } from 'react'
import { deleteDraft, loadDraft, saveDraft } from '@/lib/editor/draft-store'
import type { LessonDraft } from '@/lib/editor/draft-store'

const AUTOSAVE_DELAY_MS = 800

interface UseLessonDraftOptions {
  key: string
  /** The file as published, once it has loaded. */
  published: string | undefined
  source: string
  baseline: string
  onRestore: (draft: LessonDraft) => void
}

export function useLessonDraft({ key, published, source, baseline, onRestore }: UseLessonDraftOptions) {
  const [offer, setOffer] = useState<LessonDraft | null>(null)
  const isDirty = published !== undefined && source !== baseline

  useEffect(() => {
    if (published === undefined) return
    const stored = loadDraft(key)
    setOffer(stored && stored.content !== published ? stored : null)
  }, [key, published])

  const draftRef = useRef<LessonDraft | null>(null)
  draftRef.current = isDirty ? { key, content: source, baseline, savedAt: Date.now() } : null

  useEffect(() => {
    if (published === undefined || offer) return
    const draft = draftRef.current
    const timer = setTimeout(() => (draft ? saveDraft(draft) : deleteDraft(key)), AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [source, key, published, offer])

  // visibilitychange rather than beforeunload, which is unreliable on mobile and disqualifies the
  // page from Firefox's bfcache.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && draftRef.current) saveDraft(draftRef.current)
    }
    document.addEventListener('visibilitychange', flush)
    return () => document.removeEventListener('visibilitychange', flush)
  }, [])

  return {
    offer,
    isDirty,
    restore: () => {
      if (offer) onRestore(offer)
      setOffer(null)
    },
    discard: () => {
      setOffer(null)
      deleteDraft(key)
    },
  }
}
