import { useTheme } from '@/components/providers/theme-context'
import type { IconProps } from './types'

export const ClipboardIcon = ({ className, ...props }: IconProps) => {
  const { theme } = useTheme()
  const color = theme === 'dark' ? '#FFFFFF' : '#000001'
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M2 2H7V4H4V7H2V2ZM11 2H16V7H14V4H11V2ZM9 9H22V22H9V9ZM4 10V13H7V15H2V10H4Z" fill={color} />
    </svg>
  )
}
