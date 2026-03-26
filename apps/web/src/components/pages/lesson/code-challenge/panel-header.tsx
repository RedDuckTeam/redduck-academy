import type { PropsWithChildren } from 'react'

interface Props extends PropsWithChildren {}

export const PanelHeader = ({ children }: Props) => {
  return <div className="flex items-center gap-2.5 bg-sidebar px-5 py-2.5 text-[#e0deda]">{children}</div>
}
