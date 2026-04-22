import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestNft } from '@/lib/api/certificates'
import { queryKeys } from '@/lib/query-keys'

export const useRequestNft = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ certificateId, walletAddress }: { certificateId: string; walletAddress: string }) =>
      requestNft(certificateId, walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates.all() })
    },
  })
}
