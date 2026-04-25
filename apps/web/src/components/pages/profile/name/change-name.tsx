import { Text, textVariants } from '@/components/ui/text'
import { useSession } from '@/hooks/useSession'
import { updateUserName } from '@/lib/api/user'
import { cn } from '@/lib/utils'
import { useInlineEdit } from '@/hooks/ui/useInlineEdit'
import { PencilIcon, X } from 'lucide-react'

const NAME_MAX = 35
const NAME_ALLOWED = /[^\w\s\-.'@!#$%^&*()+=[\]{};:,<>?/\\|~`"]/g

const inputTextClass = cn(
  textVariants({ variant: 'caps-20' }),
  'text-white bg-transparent border-0 p-0 shadow-none outline-none ring-0 focus:ring-0 [field-sizing:content] min-w-[1ch] max-w-full sm:text-[20px] text-[16px]',
)

interface ChangeNameProps {
  name?: string
  editable?: boolean
}

export const ChangeName = ({ name: nameProp, editable = true }: ChangeNameProps) => {
  const { session, refetch } = useSession()
  const serverName = nameProp ?? session?.user.name ?? ''

  const {
    isEditing,
    draft,
    displayValue: displayName,
    startEdit,
    discardEdit,
    inputRef,
    actionButtonRef,
    inputHandlers,
  } = useInlineEdit<string>({
    value: serverName,
    onSave: async (next) => {
      await updateUserName(next)
      await refetch()
    },
    validate: (trimmed) => {
      if (!trimmed) return 'Name is required'
      if (trimmed.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters`
      return null
    },
    transform: (raw) => raw.replace(NAME_ALLOWED, ''),
    focusCursorAtEnd: true,
    commitOnEnter: true,
    saveErrorMessage: 'Failed to update name',
  })

  if (!editable) {
    return (
      <Text variant="caps-20" className="text-white sm:text-[20px] text-[16px] break-all">
        I'm <span>{serverName || '—'}</span>
      </Text>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <div className="break-all min-w-0">
        <span className={cn(textVariants({ variant: 'caps-20' }), 'text-white sm:text-[20px] text-[16px]')}>I'm </span>
        {isEditing ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={1}
            value={draft}
            onChange={inputHandlers.onChange}
            onKeyDown={inputHandlers.onKeyDown}
            className={cn(inputTextClass, 'resize-none overflow-hidden w-full')}
            maxLength={NAME_MAX}
            autoComplete="name"
            aria-label="Display name"
          />
        ) : (
          <span className={cn(textVariants({ variant: 'caps-20' }), 'text-white sm:text-[20px] text-[16px]')}>
            {displayName || '—'}
          </span>
        )}
      </div>
      <button
        ref={actionButtonRef}
        type="button"
        onClick={isEditing ? discardEdit : startEdit}
        aria-label={isEditing ? 'Discard name changes' : 'Edit name'}
        className="shrink-0 rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {isEditing ? <X className="size-5 text-white" /> : <PencilIcon className="size-5 text-white" />}
      </button>
    </div>
  )
}
