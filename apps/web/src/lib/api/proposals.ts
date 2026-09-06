import { api } from './fetcher'
import { ApiError } from './errors'
import type { CreateProposalBody, CreateProposalResponse } from '@redduck/api-contracts'

export const createProposal = async (body: CreateProposalBody) => {
  return api().post<CreateProposalResponse>('/api/proposals', body)
}

/** One `content-rules.ts` failure, echoed back on a 422 so each can be shown next to the editor. */
export interface ProposalRuleViolation {
  rule: string
  message: string
}

// The three recoverable failures arrive as `AppError.extra` (backend index.ts spreads it into the
// JSON body, errors.ts lifts it onto `ApiError.extra`). Reading them here keeps the shape of that
// contract in one place instead of spread across the dialog's branches.

export function proposalRuleViolations(error: unknown): ProposalRuleViolation[] {
  if (!(error instanceof ApiError) || error.status !== 422) return []
  const violations = error.extra?.violations
  if (!Array.isArray(violations)) return []
  return violations.filter(
    (item): item is ProposalRuleViolation =>
      typeof item === 'object' && item !== null && typeof (item as ProposalRuleViolation).message === 'string',
  )
}

export function isProposalConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409
}

/** The lesson as it stands on `main`, sent with a 409. Null when the file was deleted there. */
export function proposalConflictContent(error: unknown): string | null {
  if (!isProposalConflict(error)) return null
  const theirs = (error as ApiError).extra?.theirs
  return typeof theirs === 'string' ? theirs : null
}

export function proposalRetryAfterMs(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.status !== 429) return null
  const value = error.extra?.retryAfterMs
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** Status 0 is the Fetcher's marker for a request that never reached the server. */
export function isProposalNetworkFailure(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0
}
