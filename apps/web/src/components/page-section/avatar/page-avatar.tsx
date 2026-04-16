import type { ReactNode } from 'react'
import { PageAvatarImage, PageAvatarImageProps } from './page-avatar-image'
import { PageAvatarText, PageAvatarTextProps } from './page-avatar-text'

interface PageAvatarProps extends PageAvatarImageProps, PageAvatarTextProps {
  imageSlot?: ReactNode
}

export const PageAvatar = ({ imageUrl, message, imageSlot }: PageAvatarProps) => {
  return (
    <div className="flex gap-5">
      <div className="pt-2.5">
        {imageSlot ?? <PageAvatarImage imageUrl={imageUrl} />}
      </div>
      <PageAvatarText message={message} />
    </div>
  )
}
