const avatarPlaceholder = '/pages/images/avatar.webp'

export interface PageAvatarImageProps {
  imageUrl?: string
}

export const PageAvatarImage = ({ imageUrl }: PageAvatarImageProps) => {
  return (
    <div className="size-[160px] rounded-full overflow-hidden flex items-center justify-center bg-[#000]">
      {imageUrl ? (
        <img src={imageUrl} alt="Avatar" className="size-[calc(100%-5px)] rounded-full object-cover" />
      ) : (
        <img src={avatarPlaceholder} alt="Avatar" className="size-[calc(100%-5px)] rounded-full object-cover" />
      )}
    </div>
  )
}
