import { Text, textVariants } from '@/components/ui/text'
import { updateUserBio } from '@/lib/api/user'
import { queryKeys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'
import { calcProgress } from '@/lib/calc-progress'
import { useInlineEdit } from '@/hooks/ui/useInlineEdit'
import { useQueryClient } from '@tanstack/react-query'
import { PencilIcon, X } from 'lucide-react'
import type { UserSettings } from '@/types/lesson'

const BIO_MAX = 300

const textareaClass = cn(
  textVariants({ variant: 'caps-20' }),
  'bg-transparent border-0 p-0 pr-6 shadow-none outline-none ring-0 focus:ring-0 resize-none w-full sm:text-[20px] text-[16px] text-[#e0deda]',
)

interface ChangeBioProps {
  initialBio: string | null
  editable?: boolean
  isPrivate?: boolean
}

export const ChangeBio = ({ initialBio, editable = true, isPrivate = false }: ChangeBioProps) => {
  const queryClient = useQueryClient()

  const {
    isEditing,
    draft,
    displayValue: bio,
    startEdit,
    discardEdit,
    inputRef,
    actionButtonRef,
    inputHandlers,
  } = useInlineEdit<string | null>({
    value: initialBio,
    onSave: async (next) => {
      const data = await updateUserBio(next)
      queryClient.setQueryData<UserSettings>(queryKeys.user.settings(), (prev) =>
        prev ? { ...prev, bio: data.bio } : prev,
      )
    },
    parse: (trimmed) => trimmed || null,
    validate: (trimmed) => (trimmed.length > BIO_MAX ? `Bio must be at most ${BIO_MAX} characters` : null),
    discardOnEscape: true,
    saveErrorMessage: 'Failed to update bio',
  })

  if (isPrivate) {
    return (
      <div className="flex flex-col gap-6">
        <Text variant="subtitle-32">_ABOUT ME</Text>
        <div className="border border-border p-5">
          <Text variant="caps-20" className="text-border sm:text-[20px] text-[16px]">
            Private profile
          </Text>
        </div>
      </div>
    )
  }

  if (!editable) {
    return (
      <div className="flex flex-col gap-6">
        <Text variant="subtitle-32">_ABOUT ME</Text>
        <div className="border border-border p-5">
          <Text variant="caps-20" className="text-[#e0deda] sm:text-[20px] text-[16px] whitespace-pre-wrap break-words min-h-[2em]">
            {initialBio || <span className="text-border">No bio yet.</span>}
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Text variant="subtitle-32">_ABOUT ME</Text>
      <div className="relative flex flex-col gap-3 border border-border p-5">
        {isEditing ? (
          <>
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={inputHandlers.onChange}
              onKeyDown={inputHandlers.onKeyDown}
              rows={4}
              maxLength={BIO_MAX}
              className={textareaClass}
              placeholder="Tell something about yourself..."
              aria-label="Bio"
            />
            <div className="flex flex-col gap-1.5">
              <Text variant="caps-12" className="text-border">
                {draft.length}/{BIO_MAX}
              </Text>
              <div className="h-0.5 w-full bg-border overflow-hidden">
                <div
                  className="h-full bg-[#e0deda] transition-all duration-150"
                  style={{ width: `${calcProgress(draft.length, BIO_MAX)}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <Text variant="caps-20" className="text-[#e0deda] sm:text-[20px] text-[16px] whitespace-pre-wrap break-words min-h-[2em] pr-6">
            {bio || (
              <span className="text-border">No bio yet. Click edit to add one.</span>
            )}
          </Text>
        )}

        <button
          ref={actionButtonRef}
          type="button"
          onClick={isEditing ? discardEdit : startEdit}
          aria-label={isEditing ? 'Discard bio changes' : 'Edit bio'}
          className="absolute top-4 right-4 shrink-0 rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {isEditing ? (
            <X className="size-4 text-[#e0deda]" />
          ) : (
            <PencilIcon className="size-4 text-[#e0deda]" />
          )}
        </button>
      </div>
    </div>
  )
}
