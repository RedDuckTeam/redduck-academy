import { Text } from '@/components/ui/text'
import { ProgressCards } from './progress-cards/progress-cards'
import { Button } from '@/components/ui/button'
import { LongArrowRight } from '@/components/ui/icons/long-arrow-right'
import { HomepageGrid } from '@/components/ui/icons/homepage-grid'
import { useTheme } from '@/components/providers/theme-context'

export const Progress = () => {
  const { theme } = useTheme()
  return (
    <div className="pb-[60px] px-[60px] flex flex-col gap-9">
      <HomepageGrid
        className="absolute top-0 left-[60px] w-[calc(100%-120px)] z-[-1]"
        fill={theme === 'dark' ? '#222222' : '#E0DEDA'}
        lines={theme === 'dark' ? '#333333' : '#CCCCCC'}
      />
      <div className="flex justify-between">
        <div></div>
        <ProgressCards />
      </div>
      <div className="flex items-center justify-between">
        <div className="bg-primary py-6 px-10">
          <Text variant="subtitle-45" className="text-[#000]">
            blockchain development course_
          </Text>
        </div>
        <Button variant="secondary" className="p-[60px] flex items-center gap-5">
          <Text variant="caps-20" className="text-header-foreground">
            START
          </Text>
          <LongArrowRight className="max-md:h-6" />
        </Button>
      </div>
    </div>
  )
}
