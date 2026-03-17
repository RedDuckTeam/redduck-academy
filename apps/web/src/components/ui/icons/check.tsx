import type { IconProps } from './types'

export const CheckIcon = ({ className, ...props }: IconProps) => {
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
      <path d="M4 13L4 15H6V13H4ZM4 13V11H2V13H4ZM14 13V15H12V13H14ZM14 13V11H16V13H14Z" fill="#E0DEDA" />
      <path d="M10 17V19H8V17H10Z" fill="#E0DEDA" />
      <path d="M10 15H12V17H10V15Z" fill="#E0DEDA" />
      <path d="M8 17H6V15H8V17Z" fill="#E0DEDA" />
      <path d="M10 15H12V17H10V15Z" fill="#E0DEDA" />
      <path d="M18 11H16V9H18V11Z" fill="#E0DEDA" />
      <path d="M20 9L18 9V7L20 7V9Z" fill="#E0DEDA" />
      <path d="M22 7H20V5H22V7Z" fill="#E0DEDA" />
    </svg>
  )
}
