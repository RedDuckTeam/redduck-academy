import { Fragment, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumbs'
import { coursesRoute } from '@/routes/courses'

const homeRoute = '/' as const

type PageBreadcrumbsProps =
  | {
      variant: 'lesson'
      courseSlug: string
      moduleSlug?: string
      lessonSlug?: string
    }
  | {
      variant: 'community'
      eventTitle: string
    }

export const PageBreadcrumbs = (props: PageBreadcrumbsProps) => {
  const breadcrumbs = useMemo(() => {
    if (props.variant === 'community') {
      return [
        { label: 'Community', href: homeRoute },
        { label: props.eventTitle, href: undefined },
      ]
    }
    const { courseSlug, moduleSlug, lessonSlug } = props
    return [
      { label: 'Course program', href: coursesRoute },
      {
        label: lessonSlug,
        href: lessonSlug ? `${coursesRoute}${courseSlug}/${moduleSlug}/${lessonSlug}` : undefined,
      },
    ]
  }, [
    props.variant,
    ...(props.variant === 'community'
      ? [props.eventTitle]
      : [props.courseSlug, props.moduleSlug, props.lessonSlug]),
  ])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={index}>
            <BreadcrumbItem>
              {breadcrumb.href ? (
                <BreadcrumbLink
                  asChild
                  href={breadcrumb.href}
                  className={index < breadcrumbs.length - 1 ? 'text-[#565653]' : undefined}
                >
                  <Link to={breadcrumb.href}>{breadcrumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
