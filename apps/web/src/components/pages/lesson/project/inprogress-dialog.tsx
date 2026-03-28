'use client'

import { toast } from 'sonner'
import { NextButton } from '../lecture/next-button'
import type { Lesson } from '@/types/lesson'
import { DialogBody, DialogContent } from '@/components/ui/dialog'
import { Loader } from '@/components/ui/loader'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { useSyncProjectReview } from '@/hooks/api/lessons/useSyncProjectReview'

interface InProgressDialogProps {
  courseSlug: string
  lessonSlug: string
  moduleSlug: string
  lesson: Lesson
}

export function InProgressDialog({ courseSlug, lessonSlug, moduleSlug, lesson }: InProgressDialogProps) {
  const { mutateAsync: syncReview, isPending: isSyncing } = useSyncProjectReview(courseSlug, lessonSlug)

  const handleCheckStatus = async () => {
    try {
      await syncReview()
    } catch {
      toast.error('Failed to check review status')
    }
  }

  return (
    <DialogContent showCloseButton={false}>
      <DialogBody className="flex flex-col items-center pt-10 gap-10">
        <Text variant="caps-24" className="font-normal">
          Your submission under review{' '}
        </Text>
        <Loader className="w-[100px] h-[100px]" />
        <div className="flex flex-col gap-4">
          <Text variant="main-16" className="text-secondary">
            It will take a few minutes, please wait for your submission result. You can explore other lessons while you
            wait.
          </Text>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" disabled={isSyncing} onClick={handleCheckStatus} className="w-full">
              <Text className="" variant={'caps-20'}>
                Check status
              </Text>
            </Button>
            <NextButton courseSlug={courseSlug} moduleSlug={moduleSlug} lesson={lesson} className="w-full" />
          </div>
        </div>
      </DialogBody>
    </DialogContent>
  )
}
