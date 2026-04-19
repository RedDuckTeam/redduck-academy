import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateAdminCertificate } from '@/lib/api/admin'
import { queryKeys } from '@/lib/query-keys'

export const useGenerateCertificate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, courseSlug }: { userId: string; courseSlug: string }) =>
      generateAdminCertificate({ userId, courseSlug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'certificates'] })
    },
  })
}
