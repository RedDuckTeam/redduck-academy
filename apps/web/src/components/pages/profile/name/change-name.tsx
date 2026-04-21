import { Text, textVariants } from '@/components/ui/text'
import { useSession } from '@/hooks/useSession'
import { updateUserName } from '@/lib/api/user'
import { cn } from '@/lib/utils'
import { PencilIcon, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

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
  const [localOverride, setLocalOverride] = useState<string | null>(null)
  const displayName = localOverride ?? serverName

  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(displayName)
  const inputRef = useRef<HTMLInputElement>(null)
  const actionButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  const commit = useCallback(() => {
    if (!isEditing) return

    const trimmed = draftName.trim()
    if (!trimmed) {
      toast.error('Name is required')
      setIsEditing(false)
      return
    }
    if (trimmed.length > 42) {
      toast.error('Name must be at most 42 characters')
      setIsEditing(false)
      return
    }

    if (trimmed === displayName) {
      setIsEditing(false)
      return
    }

    setIsEditing(false)
    setLocalOverride(trimmed)

    void updateUserName(trimmed)
      .then(async () => {
        await refetch()
        setLocalOverride(null)
      })
      .catch(() => {
        setLocalOverride(null)
        toast.error('Failed to update name')
      })
  }, [isEditing, draftName, displayName, refetch])

  useEffect(() => {
    if (!isEditing) return

    const onPointerDown = (e: PointerEvent) => {
      const el = inputRef.current
      if (!el || el.contains(e.target as Node)) return
      if (actionButtonRef.current?.contains(e.target as Node)) return
      commit()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [isEditing, commit])

  const startEdit = () => {
    setDraftName(displayName)
    setIsEditing(true)
  }

  const discardEdit = () => {
    setIsEditing(false)
  }

  if (!editable) {
    return (
      <div className="flex items-center gap-2">
        <Text variant="caps-20" className="text-white sm:text-[20px] text-[16px]">
          I'm
        </Text>
        <Text variant="caps-20" className="text-white sm:text-[20px] truncate max-w-[300px] text-[16px]">
          {serverName || '—'}
        </Text>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Text variant="caps-20" className="text-white sm:text-[20px] text-[16px]">
          I'm
        </Text>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              }
            }}
            className={inputTextClass}
            maxLength={42}
            autoComplete="name"
            aria-label="Display name"
          />
        ) : (
          <Text variant="caps-20" className="text-white sm:text-[20px]  truncate max-w-[300px] xl text-[16px]">
            {displayName || '—'}
          </Text>
        )}
      </div>
      <button
        ref={actionButtonRef}
        type="button"
        onClick={isEditing ? discardEdit : startEdit}
        aria-label={isEditing ? 'Discard name changes' : 'Edit name'}
        className="shrink-0 rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {isEditing ? <X className="size-4 text-white" /> : <PencilIcon className="size-4 text-white" />}
      </button>
    </div>
  )
}
