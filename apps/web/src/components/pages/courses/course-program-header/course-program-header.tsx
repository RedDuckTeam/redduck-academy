import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { Course } from '@/types/lesson'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { LockedCourseBadge } from '@/components/pages/home/my-progress/locked-course-badge'
import { isCourseFullyCompleted } from '@/lib/lessons/course-completion'
import { cn } from '@/lib/utils'
import { useUserCertificates } from '@/hooks/api/certificates/useUserCertificates'
import { useClaimCertificate } from '@/hooks/api/certificates/useClaimCertificate'
import { useSession } from '@/hooks/useSession'
import { updateUserName } from '@/lib/api/user'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

interface CourseProgramHeaderProps {
  course: Course
  completedLessons: Set<number>
  isLocked?: boolean
  prerequisiteCourseSlug?: string
  prerequisiteCourseTitle?: string
  className?: string
}

export const CourseProgramHeader = ({
  course,
  completedLessons,
  isLocked,
  prerequisiteCourseSlug,
  prerequisiteCourseTitle,
  className,
}: CourseProgramHeaderProps) => {
  const showCertificate = isCourseFullyCompleted(course, completedLessons)
  const { data: certificates } = useUserCertificates()
  const { mutate: claim, isPending: isClaiming } = useClaimCertificate()
  const { session, refetch } = useSession()
  const navigate = useNavigate()

  const [showNameDialog, setShowNameDialog] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  const certificate = certificates?.find((c) => c.courseSlug === course.slug)

  const openNameDialog = () => {
    setNameInput(session?.user?.name ?? '')
    setShowNameDialog(true)
  }

  const handleConfirmClaim = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed) {
      toast.error('Name is required')
      return
    }
    if (trimmed.length > 35) {
      toast.error('Name must be at most 35 characters')
      return
    }

    if (trimmed !== session?.user?.name) {
      setIsSavingName(true)
      try {
        await updateUserName(trimmed)
        await refetch()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update name')
        return
      } finally {
        setIsSavingName(false)
      }
    }

    setShowNameDialog(false)
    claim(
      { courseSlug: course.slug },
      {
        onSuccess: (data) => {
          navigate({ to: '/certificates/$certificateId', params: { certificateId: data.id } })
        },
        onError: () => toast.error('Could not issue certificate'),
      },
    )
  }

  return (
    <>
      <section
        className={cn('flex gap-5 bg-[#e0cdc6] p-5 md:p-10 max-md:flex-col max-md:gap-8', className)}
        aria-labelledby="course-program-title"
      >
        <div className="flex min-w-0 min-h-0 flex-1 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Text id="course-program-title" element="h1" variant="subtitle-32" className="text-[#000]">
              {course.title}_
            </Text>
            {isLocked ? (
              <LockedCourseBadge
                prerequisiteCourseTitle={prerequisiteCourseTitle}
                prerequisiteCourseSlug={prerequisiteCourseSlug}
              />
            ) : showCertificate ? (
              certificate ? (
                <Button className="text-[#000]" asChild>
                  <Link to="/certificates/$certificateId" params={{ certificateId: certificate.id }}>
                    View Certificate
                  </Link>
                </Button>
              ) : (
                <Button className="text-[#000]" onClick={openNameDialog} disabled={isClaiming}>
                  {isClaiming ? 'Claiming…' : 'Claim Certificate'}
                </Button>
              )
            ) : null}
          </div>
          <Text variant="main-16" className="text-[#000]">
            {course.description}
          </Text>
        </div>
      </section>

      <Dialog open={showNameDialog} onOpenChange={(o) => !o && setShowNameDialog(false)}>
        <DialogContent showCloseButton={false} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Claim Certificate</DialogTitle>
          </DialogHeader>
          <DialogBody className="gap-6">
            <div className="flex flex-col gap-2">
              <Text variant="main-18">Confirm the name that will appear on your certificate.</Text>
            </div>
            <Input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleConfirmClaim()
                }
              }}
              maxLength={35}
              autoComplete="name"
              placeholder="Your name"
              className="w-full"
            />
            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                onClick={() => void handleConfirmClaim()}
                disabled={isSavingName || isClaiming || !nameInput.trim()}
              >
                {isSavingName || isClaiming ? 'Please wait…' : 'Claim Certificate'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowNameDialog(false)}>
                Cancel
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}
