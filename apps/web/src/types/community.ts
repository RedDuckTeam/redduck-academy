export interface CommunityEventPhoto {
  id: number
  url: string | null
  alt: string
  width?: number | null
  height?: number | null
}

export interface CommunityEventListItem {
  id: number
  title: string
  slug: string | null
  description: string
  eventDate: string | null
  createdAt: string
  updatedAt: string
  photo: CommunityEventPhoto
}

export interface CommunityEvent extends CommunityEventListItem {
  content?: unknown
}
