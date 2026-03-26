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
        className="relative text-lg font-medium text-header-foreground"
        activeProps={{
          className: 'relative text-lg font-medium text-header-foreground',
        }}
      >
        {text}
      </Link>
    )
  },
)
HeaderLink.displayName = 'HeaderLink'
