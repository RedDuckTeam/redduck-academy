import { Switch } from '@/components/ui/switch'
import { textVariants } from '@/components/ui/text'
import { BaseTooltip } from '@/components/ui/base-tooltip'

interface SettingsSwitchProps {
  label: string
  tooltip: string
  checked: boolean
  onChange: (value: boolean) => void
}

export const SettingsSwitch = ({ label, tooltip, checked, onChange }: SettingsSwitchProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <p className={textVariants({ variant: 'caps-20' })}>{label}</p>
        <BaseTooltip>{tooltip}</BaseTooltip>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
