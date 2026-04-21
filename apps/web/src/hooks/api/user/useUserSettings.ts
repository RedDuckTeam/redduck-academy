import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserSettings, updateUserSettings, updateUserUsername } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'
import { useSession } from '@/hooks/useSession'

export const useUserSettings = () => {
  const { session } = useSession()
  return useQuery({
    queryKey: queryKeys.user.settings(),
    queryFn: getUserSettings,
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUserSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user.settings(), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.rating() })
    },
  })
}

export const useUpdateUserUsername = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUserUsername,
    onSuccess: ({ username }) => {
      queryClient.setQueryData(queryKeys.user.settings(), (old: { username: string | null } | undefined) =>
        old ? { ...old, username } : old,
      )
    },
  })
}
