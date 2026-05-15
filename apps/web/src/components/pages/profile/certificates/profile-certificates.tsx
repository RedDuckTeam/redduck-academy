import { Link } from '@tanstack/react-router'
import { useUserCertificates } from '@/hooks/api/certificates/useUserCertificates'
import { Certificate } from '@/components/ui/certificate'
import { Text } from '@/components/ui/text'
import type { Certificate as CertificateType } from '@/lib/api/certificates'
import { env } from '@/env'

interface ProfileCertificatesProps {
  certificates?: CertificateType[]
  isPrivate?: boolean
}

export function ProfileCertificates({
  certificates: externalCertificates,
  isPrivate = false,
}: ProfileCertificatesProps) {
  const { data: ownCertificates, isPending } = useUserCertificates({
    enabled: externalCertificates === undefined && !isPrivate,
  })

  if (isPrivate) {
    return (
      <Text variant="caps-24" className="text-muted-foreground text-center py-3">
        Private profile
      </Text>
    )
  }

  const certificates = externalCertificates ?? ownCertificates

  if (!externalCertificates && isPending) return null

  if (!certificates || certificates.length === 0) {
    return (
      <Text variant="caps-24" className="text-muted-foreground text-center py-3">
        Complete your first course to earn a certificate
      </Text>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
      {certificates.map((cert) => {
        const completionDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(cert.issuedAt))
        return (
          <Link
            key={cert.id}
            to="/certificates/$certificateId"
            params={{ certificateId: cert.humanId }}
            className="flex flex-col gap-3 group border border-border"
          >
            <Certificate
              recipientName={cert.name}
              courseName={`${cert.courseTitle} by RedDuck`}
              completionDate={completionDate}
              humanId={cert.humanId}
              qrUrl={`${env.VITE_APP_URL.replace(/\/$/, '')}/certificates/${cert.humanId}`}
              className="group-hover:opacity-90 transition-opacity duration-200"
            />
            <Text variant="caps-14" className="truncate text-center mb-1">
              {cert.courseTitle}
            </Text>
          </Link>
        )
      })}
    </div>
  )
}
