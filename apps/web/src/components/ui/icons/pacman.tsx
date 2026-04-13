import { useTheme } from '@/components/providers/theme-context'
import type { IconProps } from './types'

export const PacmanIcon = ({ className, ...props }: IconProps) => {
  const { theme } = useTheme()
  const color = theme === 'dark' ? '#e0deda' : '#000001'
  return (
    <svg
      width="39"
      height="43"
      viewBox="0 0 39 43"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M39 11.7249H35.1102V15.6247H27.3051V19.5501H23.4154V23.4499H27.3051V27.3496H35.1102V31.2751H39V35.1748H35.1102V39.1002H27.3051V43H15.6102V39.1002H7.80512V35.1748H3.91536V27.3496H0V15.6247H3.91536V7.82518H7.80512V3.89976H15.6102V0H27.3051V3.89976H35.1102V7.82518H39V11.7249ZM19.5 11.7249H15.6102V15.6247H19.5V11.7249Z"
        fill={color}
      />
    </svg>
  )
}
