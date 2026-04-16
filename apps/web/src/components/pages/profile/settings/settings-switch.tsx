import { useId } from 'react'
import { Switch } from '@/components/ui/switch'
import { textVariants } from '@/components/ui/text'

interface SettingsSwitchProps {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}

export const SettingsSwitch = ({ label, checked, onChange }: SettingsSwitchProps) => {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className={textVariants({ variant: 'caps-20' })}>
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
