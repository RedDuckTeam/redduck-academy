import { useMutation, useQueryClient } from '@tanstack/react-query'
import { claimCertificate } from '@/lib/api/certificates'
import { queryKeys } from '@/lib/query-keys'
import { usePostHog } from '@posthog/react'

export const useClaimCertificate = () => {
  const queryClient = useQueryClient()
  const posthog = usePostHog()

  return useMutation({
    mutationFn: ({ courseSlug }: { courseSlug: string }) => claimCertificate(courseSlug),
    onSuccess: (_, { courseSlug }) => {
      posthog.capture('certificate_claimed', { course_slug: courseSlug })
      queryClient.invalidateQueries({ queryKey: queryKeys.certificates.all() })
    },
  })
}
