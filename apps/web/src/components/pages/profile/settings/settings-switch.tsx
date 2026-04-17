import { Switch } from '@/components/ui/switch'
import { textVariants } from '@/components/ui/text'
import { BaseTooltip } from '@/components/ui/base-tooltip'

interface SettingsSwitchProps {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}

export const SettingsSwitch = ({ label, checked, onChange }: SettingsSwitchProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <p className={textVariants({ variant: 'caps-20' })}>{label}</p>
        <BaseTooltip>Your profile will be hidden from other users and rating table.</BaseTooltip>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
