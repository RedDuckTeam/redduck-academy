/**
 * Shape packed into `coding_task_submissions.ai_comment` (and the cache row's `aiComment`).
 * Kept as a JSON string in a text column so we don't need a schema change to evolve it.
 */
export interface VerdictMetadata {
  /** Browser-side test verdict; null when the lesson has no executable cases. */
  clientPassed: boolean | null
  /** AI second-layer approval; only present when AI was called. */
  aiApproved?: boolean
  /** Set when the legacy AI-only path was used (no executable cases). */
  legacy?: boolean
  /** Free-text admin note (1-2 sentences) — never shown to students. */
  note: string
}

export function packVerdictComment(meta: VerdictMetadata): string {
  return JSON.stringify(meta)
}
