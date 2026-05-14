import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestNft } from '@/lib/api/certificates'
import { queryKeys } from '@/lib/query-keys'
import { usePostHog } from '@posthog/react'

export const useRequestNft = () => {
  const queryClient = useQueryClient()
  const posthog = usePostHog()

  return useMutation({
    mutationFn: ({ certificateId, walletAddress }: { certificateId: string; walletAddress: string }) =>
      requestNft(certificateId, walletAddress),
    onSuccess: (_, { certificateId, walletAddress }) => {
      posthog.capture('nft_requested', { certificate_id: certificateId, wallet_address: walletAddress })
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates.all() })
    },
  })
}
