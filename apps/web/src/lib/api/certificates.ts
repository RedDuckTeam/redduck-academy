import { api } from './fetcher'

export interface Certificate {
  id: string
  courseSlug: string
  courseTitle: string
  issuedAt: string
  name: string
  status: 'created' | 'requested' | 'claimed'
  metadataUri: string | null
  imageUrl: string | null
  tokenId: string | null
  txHash: string | null
  walletAddress: string | null
}

export interface PublicCertificate extends Certificate {
  courseTitle: string
}

export const getCertificateById = async (id: string): Promise<PublicCertificate> => {
  const response = await api().get<{ data: PublicCertificate }>(`/api/certificates/${id}`)
  return response.data
}

export const getUserCertificates = async (): Promise<Certificate[]> => {
  const response = await api({ credentials: 'include' }).get<{ data: Certificate[] }>('/api/certificates')
  return response.data ?? []
}

export const claimCertificate = async (courseSlug: string): Promise<Certificate> => {
  const response = await api({ credentials: 'include' }).post<{ data: Certificate }>(
    `/api/certificates/${courseSlug}/claim`,
    {},
  )
  return response.data
}

export const requestNft = async (certificateId: string, walletAddress: string): Promise<Certificate> => {
  const response = await api({ credentials: 'include' }).post<{ data: Certificate }>(
    `/api/certificates/${certificateId}/request-nft`,
    { walletAddress },
  )
  return response.data
}
