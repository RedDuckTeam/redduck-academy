import { Switch } from '@/components/ui/switch'
import { textVariants } from '@/components/ui/text'
import { BaseTooltip } from '@/components/ui/base-tooltip'

interface SettingsSwitchProps {
  label: string
  tooltip?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export const SettingsSwitch = ({ label, tooltip, checked, onChange, disabled }: SettingsSwitchProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <p className={textVariants({ variant: 'caps-20' })}>{label}</p>
      </div>
      {tooltip && <BaseTooltip>{tooltip}</BaseTooltip>}
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}
