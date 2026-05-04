import { useUserSettings, useUpdateUserSettings } from '@/hooks/api/user/useUserSettings'
import { Switch } from '@/components/ui/switch'
import { BaseTooltip } from '@/components/ui/base-tooltip'
import { textVariants } from '@/components/ui/text'

export const PrivateProfileSwitch = () => {
  const { data } = useUserSettings()
  const { mutate } = useUpdateUserSettings()
  const isBanned = data?.blacklisted ?? false
  const checked = data?.isPrivate ?? true

  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={(isPrivate) => mutate({ isPrivate })} disabled={isBanned} />
      <span className={textVariants({ variant: 'caps-20' }) + ' text-white'}>{checked ? 'Private' : 'Public'}</span>
      <BaseTooltip>
        {isBanned
          ? 'Banned accounts must keep a private profile.'
          : 'Your profile will be hidden from other users and the rating table.'}
      </BaseTooltip>
    </div>
  )
}
