import type { IconProps } from './types'

export const PlayIcon = ({ className, ...props }: IconProps) => {
  return (
    <svg
      width="14"
      height="20"
      viewBox="0 0 14 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M0 20L0 0L14 10L0 20Z" fill="black" />
    </svg>
  )
}
