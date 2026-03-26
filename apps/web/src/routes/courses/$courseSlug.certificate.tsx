import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageBreadcrumbs } from '@/components/common/breadcrumbs'
import { CourseCertificatePage } from '@/components/pages/certificate/course-certificate-page'
import { getCourse } from '@/lib/api/courses'
import { createCourseCertificateMeta } from '@/lib/seo'

export const Route = createFileRoute('/courses/$courseSlug/certificate')({
  ssr: true,
  loader: async ({ params }) => {
    const res = await getCourse(params.courseSlug)
    if (!res?.data) throw notFound()
    return { course: res.data, courseSlug: params.courseSlug }
  },
  head: ({ loaderData, params }) =>
    createCourseCertificateMeta({
      courseTitle: loaderData!.course.title,
      courseSlug: params.courseSlug,
    }),
  component: CourseCertificateRoute,
})

function CourseCertificateRoute() {
  const { course } = Route.useLoaderData()

  return (
    <main className="certificate-print-page mb-[60px] flex min-h-screen flex-col gap-3.5 bg-background mx-[60px]">
      <div className="print:hidden">
        <PageBreadcrumbs variant="certificate" />
      </div>
      <CourseCertificatePage course={course} />
    </main>
  )
}
