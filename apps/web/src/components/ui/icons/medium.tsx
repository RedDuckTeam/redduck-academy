import type { SVGProps } from 'react'

export function MediumIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={40}
      height={40}
      viewBox="0 0 40 40"
      {...props}
    >
      <path
        fill="inherit"
        d="m32 11.089-2.023 1.928a.586.586 0 0 0-.225.565v14.167a.585.585 0 0 0 .225.565l1.975 1.928v.423h-9.934v-.423l2.046-1.975c.201-.2.201-.259.201-.564V16.25l-5.689 14.368h-.768L11.185 16.25v9.63c-.056.405.08.812.366 1.105l2.661 3.21v.424H6.667v-.424l2.66-3.21c.285-.293.413-.703.344-1.105V14.745a.973.973 0 0 0-.32-.823l-2.365-2.834v-.423h7.344l5.677 12.381 4.991-12.38H32v.422z"
      />
    </svg>
  )
}
