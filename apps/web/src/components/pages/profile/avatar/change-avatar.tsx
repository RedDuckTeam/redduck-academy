import { PageAvatarImage } from '@/components/page-section/avatar/page-avatar-image'
import { useSession } from '@/hooks/useSession'
import { uploadUserAvatar } from '@/lib/api/user'
import { UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface ChangeAvatarProps {
  imageUrl?: string
  editable?: boolean
}

export const ChangeAvatar = ({ imageUrl, editable = true }: ChangeAvatarProps) => {
  const { refetch } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const displayUrl = localPreview ?? imageUrl

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please select a valid image (JPEG, PNG, WebP or GIF)')
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error('Image must be smaller than 2 MB')
      return
    }

    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)
    setIsUploading(true)

    try {
      await uploadUserAvatar(file)
      await refetch()
      setLocalPreview(null)
    } catch {
      toast.error('Failed to upload avatar')
      setLocalPreview(null)
    } finally {
      setIsUploading(false)
      URL.revokeObjectURL(preview)
    }
  }

  if (!editable) {
    return <PageAvatarImage imageUrl={displayUrl} />
  }

  return (
    <div className="relative group cursor-pointer" onClick={() => !isUploading && inputRef.current?.click()}>
      <PageAvatarImage imageUrl={displayUrl} />

      <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity">
        <UploadCloud className="size-7 text-black" strokeWidth={1.5} />
        <span className="text-[11px] font-medium text-black leading-none">Upload image</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  )
}
