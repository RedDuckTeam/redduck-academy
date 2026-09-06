import { useMutation } from '@tanstack/react-query'
import { createProposal } from '@/lib/api/proposals'
import type { CreateProposalBody, CreateProposalResponse } from '@redduck/api-contracts'

/**
 * No `onError` toast and no retry, unlike the other submit mutations: every failure here has a
 * specific recovery rendered inside the submit dialog (409 rebase, 429 countdown, 422 rule list),
 * and a blind retry would re-spend a single-use Turnstile token as `timeout-or-duplicate`.
 */
export const useCreateProposal = () =>
  useMutation<CreateProposalResponse, Error, CreateProposalBody>({
    mutationFn: createProposal,
    retry: false,
  })
