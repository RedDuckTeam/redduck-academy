import type { IconProps } from './types'

export const ChevronUpIcon = ({ className, ...props }: IconProps) => {
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
      <path d="M17 14V12H15V14H17ZM17 14V16H19V14H17ZM7 14V12H9V14H7ZM7 14V16H5V14H7Z" fill="white" />
      <path d="M11 12H9V10H11V12Z" fill="white" />
      <path d="M11 10V8H13V10H11Z" fill="white" />
      <path d="M13 10H15V12H13V10Z" fill="white" />
    </svg>
  )
}
