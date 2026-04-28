import { api } from './fetcher'
import type { CommunityEvent } from '@/types/community'

export interface GetCommunityEventsResponse {
  data: CommunityEvent[]
}

export interface GetCommunityEventResponse {
  data: CommunityEvent
}

export const getCommunityEvents = async () => {
  return api().get<GetCommunityEventsResponse>('/api/community')
}

export const getCommunityEvent = async (slug: string) => {
  return api().get<GetCommunityEventResponse>(`/api/community/${encodeURIComponent(slug)}`)
}
