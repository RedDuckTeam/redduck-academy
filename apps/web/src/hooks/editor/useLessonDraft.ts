import { useEffect, useRef, useState } from 'react'
import { deleteDraft, loadDraft, saveDraft } from '@/lib/editor/draft-store'
import type { LessonDraft, PendingDraft } from '@/lib/editor/draft-store'

const AUTOSAVE_DELAY_MS = 800

interface UseLessonDraftOptions {
  key: string
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

  useEffect(() => {
    if (isDirty) setOffer(null)
  }, [isDirty])

  const draftRef = useRef<PendingDraft | null>(null)
  draftRef.current = isDirty && !offer ? { key, content: source, baseline } : null

  useEffect(() => {
    // While an offer is up the buffer is still the published file, so this would delete the draft the banner is offering.
    if (published === undefined || offer) return
    const draft = draftRef.current
    const timer = setTimeout(
      () => (draft ? saveDraft({ ...draft, savedAt: Date.now() }) : deleteDraft(key)),
      AUTOSAVE_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [source, key, published, offer])

  // visibilitychange rather than beforeunload, which is unreliable on mobile and disqualifies the page from bfcache.
  useEffect(() => {
    const flush = () => {
      const draft = draftRef.current
      if (document.visibilityState === 'hidden' && draft) saveDraft({ ...draft, savedAt: Date.now() })
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
