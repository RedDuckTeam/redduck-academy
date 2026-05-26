import { Link } from '@tanstack/react-router'
import { Text } from '@/components/ui/text'
import { ProgressCards } from './progress-cards/progress-cards'
import { Button } from '@/components/ui/button'
import { LongArrowRight } from '@/components/ui/icons/long-arrow-right'
import { HomepageGrid } from '@/components/ui/icons/homepage-grid'
import { AnimatedGhost } from './animated-ghost'
import { AnimatedPacman } from './animated-pacman'

interface ProgressProps {
  nextLesson: { courseSlug: string; moduleSlug: string; lessonSlug: string } | null
  hasProgress: boolean
}

export const Progress = ({ nextLesson, hasProgress }: ProgressProps) => {
  const ctaLabel = hasProgress ? 'CONTINUE' : 'START'
  return (
    <div className="flex flex-col gap-9 px-5 pb-14 md:px-10 md:pb-[60px] xl:px-[60px]">
      <HomepageGrid className="absolute top-0 max-sm:hidden left-[60px] w-[calc(100%-121px)] z-[-1]" />
      <div className="flex max-xl:w-full xl:justify-between ">
        <div></div>
        <ProgressCards />
      </div>
      <div className="flex items-center max-xl:flex-col max-xl:w-full justify-between relative">
        <div className="bg-primary p-5 sm:py-6 sm:px-10 max-xl:w-full max-lg:w-screen">
          <Text variant="subtitle-45" className="text-[#000] max-2xl:hidden">
            blockchain development course_
          </Text>
          <Text variant="subtitle-32" className="text-[#000] 2xl:hidden">
            blockchain development course_
          </Text>
        </div>
        <div className="absolute max-sm:left-[10%] sm:right-[430px] xl:right-[480px] -bottom-12 xl:bottom-16">
          <AnimatedPacman />
        </div>
        <div className="absolute right-[10%] sm:right-[330px] -bottom-12 xl:bottom-0">
          <AnimatedGhost />
        </div>
        {nextLesson ? (
          <Link
            to="/courses/$courseSlug/$moduleSlug/$lessonSlug"
            params={nextLesson}
            className="flex items-center px-10 !h-[108px] gap-5 max-xl:w-full max-lg:w-screen bg-header"
          >
            <Text variant="caps-20" className="text-header-foreground">
              {ctaLabel}
            </Text>
            <LongArrowRight className="max-md:h-6" />
          </Link>
        ) : (
          <Button
            variant="secondary"
            size={'free'}
            className="flex items-center px-10 !h-[108px] gap-5 max-xl:w-full max-lg:w-screen"
          >
            <Text variant="caps-20" className="text-header-foreground">
              {ctaLabel}
            </Text>
            <LongArrowRight className="max-md:h-6" />
          </Button>
        )}
      </div>
    </div>
  )
}
