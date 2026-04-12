import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCertificateById } from '@/lib/api/certificates'
import { Certificate } from '@/components/ui/certificate'

export const Route = createFileRoute('/certificates/$certificateId')({
  ssr: true,
  loader: async ({ params }) => {
    try {
      return await getCertificateById(params.certificateId)
    } catch {
      throw notFound()
    }
  },
  component: CertificateShareRoute,
})

function CertificateShareRoute() {
  const certificate = Route.useLoaderData()

  const completionDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
    new Date(certificate.issuedAt),
  )

  return (
    <main className="mb-[60px] flex min-h-screen flex-col gap-5 mx-[60px]">
      <div className="w-full flex flex-1 items-center justify-center flex-col gap-10 px-6 py-14 md:px-10 md:py-[60px] bg-[#000]">
        <div className="mx-auto flex w-full max-w-[1280px] justify-center">
          <Certificate
            recipientName={certificate.name}
            courseName={`${certificate.courseTitle} by RedDuck`}
            completionDate={completionDate}
          />
        </div>
      </div>
    </main>
  )
}
