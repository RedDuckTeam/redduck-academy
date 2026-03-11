import type { PropsWithChildren } from 'react'

interface Props extends PropsWithChildren {}

export const PanelHeader = ({ children }: Props) => {
  return <div className="flex items-center bg-black gap-2.5 py-2.5 px-5">{children}</div>
}
