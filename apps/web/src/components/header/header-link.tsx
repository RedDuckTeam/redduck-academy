import { Link } from '@tanstack/react-router'
import { forwardRef } from 'react'

interface HeaderLinkProps {
  to: string
  text: string
}
export const HeaderLink = forwardRef<HTMLAnchorElement, HeaderLinkProps>(
  ({ to, text }, ref) => {
    return (
      <Link
        ref={ref}
        to={to}
        className="text-white text-lg font-medium relative"
        activeProps={{
          className: 'text-white text-lg font-medium relative',
        }}
      >
        {text}
      </Link>
    )
  },
)
HeaderLink.displayName = 'HeaderLink'
