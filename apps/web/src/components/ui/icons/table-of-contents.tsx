import type { IconProps } from './types'

export const TableOfContentsIcon = ({ className, ...props }: IconProps) => {
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
      <path
        d="M3 5H21V8H3V5ZM3 10.5H17V13.5H3V10.5ZM3 16H11V19H3V16Z"
        fill="currentColor"
      />
    </svg>
  )
}
