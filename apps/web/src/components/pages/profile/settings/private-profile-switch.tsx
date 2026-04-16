import { useState } from 'react'
import { SettingsSwitch } from './settings-switch'

export const PrivateProfileSwitch = () => {
  const [checked, setChecked] = useState(true)
  return <SettingsSwitch label="Private Profile" checked={checked} onChange={setChecked} />
}
