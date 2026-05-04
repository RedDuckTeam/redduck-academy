import { useUserSettings, useUpdateUserSettings } from '@/hooks/api/user/useUserSettings'
import { Switch } from '@/components/ui/switch'
import { BaseTooltip } from '@/components/ui/base-tooltip'
import { textVariants } from '@/components/ui/text'

export const SkipPrerequisitesSwitch = () => {
  const { data } = useUserSettings()
  const { mutate } = useUpdateUserSettings()
  const checked = data?.skipPrerequisites ?? false

  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={(skipPrerequisites) => mutate({ skipPrerequisites })} />
      <span className={textVariants({ variant: 'caps-20' }) + ' text-white'}>{checked ? 'On' : 'Off'}</span>
      <BaseTooltip>Unlock all courses regardless of completion order.</BaseTooltip>
    </div>
  )
}
