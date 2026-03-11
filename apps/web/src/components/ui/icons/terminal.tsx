import type { IconProps } from './types'

export const TerminalIcon = ({ className, ...props }: IconProps) => {
  return (
    <svg
      width="34"
      height="20"
      viewBox="0 0 34 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M0 0V20H34V0H0ZM13.5941 11.1079H11.3333V13.3236H9.07262V15.5539H6.79703V13.3236H9.07262V11.1079H11.3333V8.89213H9.07262V6.66181H6.79703V4.44606H9.07262V6.66181H11.3333V8.89213H13.5941V11.1079ZM27.203 11.1079H18.1304V8.89213H27.203V11.1079Z"
        fill="#000001"
      />
    </svg>
  )
}
