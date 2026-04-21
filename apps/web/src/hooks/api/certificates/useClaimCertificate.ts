import { useMutation, useQueryClient } from '@tanstack/react-query'
import { claimCertificate } from '@/lib/api/certificates'
import { queryKeys } from '@/lib/query-keys'

export const useClaimCertificate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseSlug }: { courseSlug: string }) => claimCertificate(courseSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates.all() })
    },
  })
}
