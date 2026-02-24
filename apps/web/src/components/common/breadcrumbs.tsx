import { Fragment, useMemo } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '../ui/breadcrumbs'
import { coursesRoute } from '@/routes/courses'

interface PageBreadcrumbsProps {
  courseSlug: string
  moduleSlug?: string
  lessonSlug?: string
}

export const PageBreadcrumbs = ({
  courseSlug,
  moduleSlug,
  lessonSlug,
}: PageBreadcrumbsProps) => {
  const breadcrumbs = useMemo(() => {
    return [
      { label: 'Course program', href: coursesRoute },
      {
        label: lessonSlug,
        href: lessonSlug
          ? `${coursesRoute}${courseSlug}/${moduleSlug}/${lessonSlug}`
          : undefined,
      },
    ]
  }, [courseSlug, moduleSlug, lessonSlug])
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={index}>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={breadcrumb.href}
                className={
                  index < breadcrumbs.length - 1 ? 'text-[#565653]' : undefined
                }
              >
                {breadcrumb.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
