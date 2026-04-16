import { HeaderLink } from './header-link'
import { headerLinks, useHeaderLinks } from '@/hooks/ui/useHeaderLinks'

export const HeaderLinks = () => {
  const { refs, triangleLeft, activeLinkRef } = useHeaderLinks()

  return (
    <nav className="flex flex-1 justify-center items-center gap-10 relative">
      {headerLinks.map((link, index) => (
        <HeaderLink key={link.to} ref={refs[index]} to={link.to} text={link.text} />
      ))}

      {activeLinkRef?.current && (
        <div
          className="absolute -bottom-[26px] inline-block w-0 h-0 border-solid border-t-0 border-r-[15px] border-l-[15px] border-b-[16px] border-l-transparent border-r-transparent border-t-transparent border-primary transition-all duration-300"
          style={{
            left: `${triangleLeft}px`,
          }}
        />
      )}
    </nav>
  )
}
