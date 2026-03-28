import { Link, useLocation } from '@tanstack/react-router'

import { useState } from 'react'
import { RedDuckIcon } from '../ui/icons/redduck'
import { HeaderLinks } from './header-links'
import { ThemeToggle } from './theme-toggle'
import { Drawer, DrawerContent } from '../ui/drawer-menu'
import { HeaderMenuIcon } from '../ui/icons/header-menu'
import { HeaderDrawerContent } from './header-drawer-content'
import { cn } from '@/lib/utils'

export default function Header() {
  const location = useLocation()
  const isSignUpPage = location.pathname === '/sign-up'
  const [isOpen, setIsOpen] = useState(false)

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
          isOpen && 'fixed w-full z-50',
        )}
      >
        <button
          onClick={handleOpenChange}
          className={cn(
            'rounded-full md:hidden w-10 h-10 border border-white flex items-center justify-center',
            isOpen && 'pointer-events-none',
          )}
        >
          <HeaderMenuIcon isOpen={isOpen} />
        </button>
        <div className="md:w-[20%] xl:w-[15%]">
          <Link to="/">
            <RedDuckIcon className="w-full max-sm:w-[130px]" />
          </Link>
        </div>
        <div className="flex-1 max-md:hidden">
          <HeaderLinks />
        </div>
        <div className="flex xl:w-[15%] items-center max-md:w-10 justify-end gap-4">
          <div className="max-md:hidden">
            <ThemeToggle />
          </div>
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
