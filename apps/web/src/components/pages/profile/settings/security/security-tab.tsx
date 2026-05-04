import { ExportPrivateKey } from './export-private-key'

export const SecurityTab = () => {
  return (
    <div className="flex flex-col gap-10 sm:gap-5">
      <ExportPrivateKey />
    </div>
  )
}
