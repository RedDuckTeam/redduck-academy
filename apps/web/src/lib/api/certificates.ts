import { api } from './fetcher'

export interface Certificate {
  id: string
  courseSlug: string
  issuedAt: string
  name: string
  status: 'created' | 'requested' | 'claimed'
  metadataUri: string | null
  imageUrl: string | null
  tokenId: string | null
  txHash: string | null
}

interface GetCertificatesResponse {
  data: Certificate[]
}

interface CertificateResponse {
  data: Certificate
}

export interface PublicCertificate extends Certificate {
  courseTitle: string
}

interface GetCertificateByIdResponse {
  data: PublicCertificate
}

export const getCertificateById = async (id: string): Promise<PublicCertificate> => {
  const response = await api().get<GetCertificateByIdResponse>(`/api/certificates/${id}`)
  return response.data!.data
}

export const getUserCertificates = async (): Promise<Certificate[]> => {
  const response = await api({ credentials: 'include' }).get<GetCertificatesResponse>(
    '/api/certificates',
  )
  return response.data?.data ?? []
}

export const claimCertificate = async (courseSlug: string): Promise<Certificate> => {
  const response = await api({ credentials: 'include' }).post<CertificateResponse>(
    `/api/certificates/${courseSlug}/claim`,
    {},
  )
  return response.data!.data
}

export const requestNft = async (certificateId: string): Promise<Certificate> => {
  const response = await api({ credentials: 'include' }).post<CertificateResponse>(
    `/api/certificates/${certificateId}/request-nft`,
    {},
  )
  return response.data!.data
}
