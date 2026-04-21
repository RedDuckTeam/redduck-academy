import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageBreadcrumbs } from '@/components/common/breadcrumbs'
import { getCertificateById } from '@/lib/api/certificates'
import { Certificate } from '@/components/ui/certificate'
import { useSession } from '@/hooks/useSession'
import { CertificateHeader } from '@/components/pages/certificate/certificate-header'
import { CertificateActions } from '@/components/pages/certificate/certificate-actions'

export const Route = createFileRoute('/certificates/$certificateId')({
  ssr: true,
  loader: async ({ params }) => {
    try {
      return await getCertificateById(params.certificateId)
    } catch {
      throw notFound()
    }
  },
  component: CertificateRoute,
})

function CertificateRoute() {
  const certificate = Route.useLoaderData()
  const { session } = useSession()
  const isAuthenticated = !!session

  const completionDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
    new Date(certificate.issuedAt),
  )
  const courseLine = `${certificate.courseTitle} by RedDuck`

  return (
    <main className="mb-[60px] flex min-h-screen flex-col gap-3.5 md:mx-[60px]">
      <div className="mx-5">
        <PageBreadcrumbs
          variant="certificate"
          courseTitle={certificate.courseTitle}
          courseSlug={certificate.courseSlug}
        />
      </div>
      <div className="w-full flex flex-col gap-10 px-6 py-14 md:px-10 md:py-[60px] bg-[#000]">
        {isAuthenticated && <CertificateHeader courseTitle={certificate.courseTitle} />}
        <div className="certificate-print-root mx-auto flex w-full max-w-[880px] justify-center print:max-w-none print:py-0">
          <Certificate recipientName={certificate.name} courseName={courseLine} completionDate={completionDate} />
        </div>
        <CertificateActions
          certificate={certificate}
          courseLine={courseLine}
          completionDate={completionDate}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </main>
  )
}
