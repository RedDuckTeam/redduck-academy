import { textVariants } from '@/components/ui/text'
import { useUserSettings, useUpdateUserUsername } from '@/hooks/api/user/useUserSettings'
import { useSession } from '@/hooks/useSession'
import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export const ChangeUsername = () => {
  const { data: settings } = useUserSettings()
  const { mutateAsync, isPending } = useUpdateUserUsername()
  const { refetch: refetchSession } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<string | null>(null)

  const currentUsername = settings?.username ?? ''
  const value = draft ?? currentUsername
  const isBanned = settings?.blacklisted ?? false

  const handleSave = async () => {
    const trimmed = value.trim()
    if (!trimmed) {
      toast.error('Username is required')
      return
    }
    if (trimmed.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      toast.error('Username can only contain letters, numbers, and underscores')
      return
    }
    if (trimmed === currentUsername) return
    try {
      const oldUsername = currentUsername
      await mutateAsync(trimmed)
      await refetchSession()
      setDraft(null)
      toast.success('Username updated')
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(oldUsername) })
      void navigate({ to: '/profile/$username', params: { username: trimmed }, replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update username')
    }
  }

  return (
    <div className="flex sm:items-center gap-3 max-sm:flex-col">
      <p className={textVariants({ variant: 'caps-20' })}>Profile handle</p>
      <div className="flex items-center border-b border-white/30 focus-within:border-white/70 py-0.5">
        <span className="text-white/50 select-none" style={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
          /profile/
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => !isBanned && setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isBanned) handleSave()
          }}
          maxLength={30}
          disabled={isBanned}
          className="bg-transparent outline-none text-white px-0 w-40 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontSize: 'inherit', fontFamily: 'inherit' }}
        />
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={isBanned || isPending || !value.trim() || value.trim() === currentUsername}
        className={
          textVariants({ variant: 'caps-20' }) + ' text-white/70 hover:text-white transition-colors disabled:opacity-30'
        }
      >
        Save
      </button>
    </div>
  )
}
