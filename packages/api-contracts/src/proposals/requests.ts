import { z } from 'zod'
import { slugField } from '../shared/slug'

/**
 * A display name is echoed into a git commit trailer, so it is validated rather than escaped:
 * a newline would let a caller append a trailer the commit was never meant to carry (notably
 * `Co-authored-by:`, which credits an unrelated GitHub account), and `@`/`#` become live mentions
 * and issue references once the name reaches a pull-request body. Rejecting is deliberate — the
 * contributor sees what was wrong instead of silently getting a different name than they typed.
 */
export const displayNameField = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[\p{L}\p{N} ._-]+$/u, 'Use letters, numbers, spaces, dots, underscores or hyphens')

/** Comfortably above the largest lesson in the corpus, far below the 5 MB global body cap. */
export const MAX_PROPOSAL_CONTENT_BYTES = 256_000

export const createProposalBodySchema = z.object({
  courseSlug: slugField,
  moduleSlug: slugField,
  lessonSlug: slugField,
  /** The full file, frontmatter included, exactly as the editor buffer holds it. */
  content: z.string().min(1).max(MAX_PROPOSAL_CONTENT_BYTES),
  /** SHA-256 of the file the editor loaded, so a concurrent edit is caught before any write. */
  baseHash: z.string().regex(/^[0-9a-f]{64}$/, 'Must be a hex SHA-256 digest'),
  /** Why the change is being made. Required — it is what makes a proposal reviewable. */
  rationale: z.string().trim().min(1).max(2000),
  displayName: displayNameField.optional(),
  /** Version string of the licence notice the contributor accepted, recorded for the audit trail. */
  licenseVersion: z.string().min(1).max(32),
  /** Cloudflare Turnstile token. Required whenever the request carries no session. */
  turnstileToken: z.string().min(1).max(2048).optional(),
})

export type CreateProposalBody = z.infer<typeof createProposalBodySchema>
