import { api } from './fetcher'

export interface Certificate {
  id: string
  courseSlug: string
  issuedAt: string
  name: string
}

interface GetCertificatesResponse {
  data: Certificate[]
}

interface ClaimCertificateResponse {
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

export const claimCertificate = async (courseSlug: string, name: string): Promise<Certificate> => {
  const response = await api({ credentials: 'include' }).post<ClaimCertificateResponse>(
    `/api/certificates/${courseSlug}/claim`,
    { name },
  )
  return response.data!.data
}
