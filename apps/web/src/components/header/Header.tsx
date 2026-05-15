import { Link, useLocation } from '@tanstack/react-router'

import { useEffect, useState } from 'react'
import { RedDuckIcon } from '../ui/icons/redduck'
import { HeaderLinks } from './header-links'
import { Drawer, DrawerContent } from '../ui/drawer-menu'
import { HeaderMenuIcon } from '../ui/icons/header-menu'
import { HeaderDrawerContent } from './header-drawer-content'
import { cn } from '@/lib/utils'
import { useSession } from '@/hooks/useSession'
import { Button } from '@/components/ui/button'
import avatarPlaceholder from '/pages/images/avatar.webp'

export default function Header() {
  const location = useLocation()
  const isSignUpPage = location.pathname === '/sign-up'
  const [isOpen, setIsOpen] = useState(false)
  const { session } = useSession()

  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  if (isSignUpPage) {
    return null
  }

  const handleOpenChange = () => {
    if (isOpen) return
    setIsOpen(true)
  }

  return (
    <>
      <header
        className={cn(
          'md:my-5 mb-5 lg:mx-[60px] flex max-md:justify-between items-center gap-5 lg:gap-10 bg-header px-5 md:px-[30px] py-2.5 md:py-5 print:hidden',
          'max-md:sticky max-md:top-0 max-md:z-40',
          isOpen && 'fixed w-full z-50',
        )}
      >
        <button
          type="button"
          onClick={handleOpenChange}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          className={cn(
            'rounded-full md:hidden w-10 h-10 border border-white flex items-center justify-center',
            isOpen && 'pointer-events-none',
          )}
        >
          <HeaderMenuIcon isOpen={isOpen} />
        </button>
        <div className="md:w-[20%] xl:w-[15%]">
          <Link to="/dashboard" aria-label="RedDuck Academy — home">
            <RedDuckIcon className="max-sm:w-[150px] h-full w-[186px]" />
          </Link>
        </div>
        <div className="flex-1 max-md:hidden">
          <HeaderLinks />
        </div>
        <div className="flex xl:w-[15%] items-center justify-end gap-4 shrink-0">
          {session?.user ? (
            <Link
              to="/profile/$username"
              params={{ username: (session.user as { username?: string }).username ?? '' }}
              aria-label="Profile"
              className="size-10 shrink-0 overflow-hidden rounded-full bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <img
                src={session.user.image?.trim() || avatarPlaceholder}
                alt="Profile"
                className="size-full object-cover"
              />
            </Link>
          ) : (
            <Button variant="default" size="sm" className="shrink-0 h-10 uppercase" asChild>
              <Link to="/sign-up">Sign in</Link>
            </Button>
          )}
        </div>
      </header>
      <div className={cn('md:hidden', isOpen && 'h-[60px] mb-5 w-full')}></div>

      <Drawer direction="left" open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <HeaderDrawerContent open={isOpen} onSelect={() => setIsOpen(false)} />
        </DrawerContent>
      </Drawer>
    </>
  )
}
