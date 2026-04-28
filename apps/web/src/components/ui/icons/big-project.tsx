import type { IconProps } from './types'

export const BigProjectIcon = ({ className, ...props }: IconProps) => {
  return (
    <svg
      width="60"
      height="55"
      viewBox="0 0 60 55"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M2.85 14.2874H57.15V51.4312H60V2.86865H57.15V11.4374H2.85V2.86865H0V51.4312H2.85V14.2874Z"
        fill="inherit"
      />
      <path d="M57.1516 51.4312H2.85156V54.2999H57.1516V51.4312Z" fill="inherit" />
      <path
        d="M8.57031 20.0063V45.7313H51.4328V20.0063H8.57031ZM25.7078 34.2938H22.8578V37.1438H20.0078V40.0126H17.1391V37.1438H20.0078V34.2938H22.8578V31.4439H20.0078V28.5751H17.1391V25.7251H20.0078V28.5751H22.8578V31.4439H25.7078V34.2938ZM42.8641 34.2938H31.4266V31.4439H42.8641V34.2938Z"
        fill="inherit"
      />
      <path d="M20.0055 5.71875H17.1367V8.5875H20.0055V5.71875Z" fill="inherit" />
      <path d="M14.2875 5.71875H11.4375V8.5875H14.2875V5.71875Z" fill="inherit" />
      <path d="M8.56875 5.71875H5.71875V8.5875H8.56875V5.71875Z" fill="inherit" />
      <path d="M57.1516 0H2.85156V2.86875H57.1516V0Z" fill="inherit" />
    </svg>
  )
}
