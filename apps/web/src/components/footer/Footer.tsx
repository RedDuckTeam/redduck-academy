import { useLocation } from '@tanstack/react-router'

import { LINKS } from '@/constants/links'
import { cn } from '@/lib/utils'
import { useCookieConsent } from '@/lib/cookie-consent'
import { DuckIcon } from '@/components/ui/icons/duck'
import { DouIcon } from '@/components/ui/icons/dou'
import { LinkedInIcon } from '@/components/ui/icons/linked-in'
import { MediumIcon } from '@/components/ui/icons/medium'
import { UpWorkIcon } from '@/components/ui/icons/up-work'

import { FooterSeparator } from './footer-separator'

const socialIconLinkClass = '-m-2 rounded-md p-2 hover:bg-white/10'

export default function Footer() {
  const location = useLocation()
  const { resetConsent } = useCookieConsent()
  if (location.pathname === '/sign-up') {
    return null
  }

  return (
    <footer className="bg-[#000000] text-white *:pb-0! print:hidden border-t border-white/20">
      <div className="border-x border-white/20 mx-auto w-full max-w-[1920px] py-[20px] md:py-[40px] 2xl:py-[60px]">
        <div className="grid grid-cols-1 grid-rows-[auto_auto] border-t border-white/20 lg:grid-cols-2 2xl:grid-cols-4">
          <div
            className={cn('p-10 text-[20px] uppercase 2xl:text-[24px]', 'border-b border-white/20 max-2xl:border-r')}
          >
            <p>contacts</p>
          </div>

          <div className="row-span-2 border-x border-white/20 max-2xl:hidden" />

          <div
            className={cn(
              'flex flex-row items-center justify-center',
              'border-b border-white/20 fill-white 2xl:col-span-2',
              'gap-[40px] max-lg:py-[35px] max-md:p-[30px] md:gap-[60px] 2xl:gap-[100px]',
            )}
          >
            <a
              href={LINKS.Medium}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="RedDuck on Medium"
              className={socialIconLinkClass}
            >
              <MediumIcon className="size-[35px]" aria-hidden="true" />
            </a>
            <a
              href={LINKS.Dou}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="RedDuck on DOU"
              className={socialIconLinkClass}
            >
              <DouIcon aria-hidden="true" />
            </a>
            <a
              href={LINKS.LinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="RedDuck on LinkedIn"
              className={socialIconLinkClass}
            >
              <LinkedInIcon aria-hidden="true" />
            </a>
            <a
              href={LINKS.Upwork}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="RedDuck on Upwork"
              className={socialIconLinkClass}
            >
              <UpWorkIcon aria-hidden="true" />
            </a>
          </div>

          <div
            className={cn(
              'space-y-5 text-[16px] font-normal 2xl:text-[20px]',
              'border-white/20 max-2xl:border-r max-lg:border-b max-lg:border-r-0',
              'px-5 py-[40px] sm:py-[66px] lg:px-10',
            )}
          >
            <a href={`mailto:${LINKS.Email}`} className="hover:border-b hover:border-white/40">
              {LINKS.Email}
            </a>
            <p>+380502147263</p>
            <p>Saperne pole 12, Kyiv, Ukraine</p>
          </div>

          <div className="flex items-end justify-end p-10 max-lg:h-[250px] max-sm:h-[180px] 2xl:col-span-2">
            <DuckIcon className="-scale-x-100 h-auto w-[60px] [&_path]:fill-[#F22C1A]" />
          </div>
        </div>

        <FooterSeparator className="h-[180px] max-sm:border-x sm:h-[80px] lg:h-[120px]" />

        <div
          className={cn(
            'flex flex-col *:py-[20px] lg:flex-row',
            'text-center text-[16px] 2xl:text-[20px]',
            'max-lg:divide-y max-lg:divide-white/20 lg:divide-x lg:divide-white/20',
          )}
        >
          <p className="flex-1">© Copyright. All rights reserved</p>
          <a href={LINKS.PrivacyPolicy} target="_blank" rel="noopener noreferrer" className="flex-1 hover:bg-white/10">
            Privacy Policy
          </a>
          <button type="button" onClick={resetConsent} className="flex-1 hover:bg-white/10">
            Cookie settings
          </button>
        </div>
      </div>
    </footer>
  )
}
