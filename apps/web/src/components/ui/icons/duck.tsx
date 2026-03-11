import type { IconProps } from './types'

export const DuckIcon = ({ className, ...props }: IconProps) => {
  return (
    <svg
      width="60"
      height="24"
      viewBox="0 0 60 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M48.1606 5.835V0H36.328V11.67H29.5916H17.7523H11.8394V5.835H0V11.67H5.91968V23.3333H17.7523H29.5916H41.431V11.67H48.1606H60V5.835H48.1606Z"
        fill="black"
      />
    </svg>
  )
}
