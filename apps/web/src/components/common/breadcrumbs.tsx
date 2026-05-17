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
      courseTitle: string
      moduleSlug?: string
      lessonSlug?: string
      lessonTitle?: string
    }
  | {
      variant: 'community'
      eventTitle: string
    }
  | {
      variant: 'certificate'
      courseTitle: string
      courseSlug: string
    }

export const PageBreadcrumbs = (props: PageBreadcrumbsProps) => {
  const breadcrumbs = useMemo(() => {
    if (props.variant === 'certificate') {
      return [
        { label: props.courseTitle, href: `${coursesRoute}${props.courseSlug}` },
        { label: 'Certificate', href: undefined },
      ]
    }
    if (props.variant === 'community') {
      return [
        { label: 'Community', href: homeRoute },
        { label: props.eventTitle, href: undefined },
      ]
    }
    const { courseSlug, courseTitle, moduleSlug, lessonSlug, lessonTitle } = props
    return [
      { label: courseTitle, href: `${coursesRoute}${courseSlug}` },
      {
        label: lessonTitle ?? lessonSlug,
        href: lessonSlug ? `${coursesRoute}${courseSlug}/${moduleSlug}/${lessonSlug}` : undefined,
      },
    ]
  }, [
    props.variant,
    ...(props.variant === 'certificate'
      ? [props.courseTitle, props.courseSlug]
      : props.variant === 'community'
        ? [props.eventTitle]
        : [props.courseSlug, props.courseTitle, props.moduleSlug, props.lessonSlug, props.lessonTitle]),
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
                  className={index < breadcrumbs.length - 1 ? 'text-[#565653] dark:text-[#9B9B9B]' : 'text-black'}
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
