import { api } from './fetcher'
import type { CommunityEvent } from '@/types/community'

export interface GetCommunityEventsResponse {
  data: CommunityEvent[]
}

export interface GetCommunityEventResponse {
  data: CommunityEvent
}

export const getCommunityEvents = async () => {
  const response = await api().get<GetCommunityEventsResponse>('/api/community')
  return response.data
}

export const getCommunityEvent = async (slug: string) => {
  const response = await api().get<GetCommunityEventResponse>(`/api/community/${encodeURIComponent(slug)}`)
  return response.data
}
