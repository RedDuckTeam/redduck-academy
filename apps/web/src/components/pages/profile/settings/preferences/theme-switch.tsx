import { textVariants } from '@/components/ui/text'
import { ThemeToggle } from '@/components/header/theme-toggle'
import { useTheme } from '@/components/providers/theme-context'

export const ThemeSwitch = () => {
  const { theme } = useTheme()

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <span className={textVariants({ variant: 'caps-20' }) + ' text-white'}>
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </div>
  )
}
