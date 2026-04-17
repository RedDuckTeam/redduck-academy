import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

const NAME_MAX_LENGTH = 42

interface SetNameScreenProps {
  onClaim: (name: string) => void
  isLoading: boolean
}

export function SetNameScreen({ onClaim, isLoading }: SetNameScreenProps) {
  const [name, setName] = useState('')

  const trimmed = name.trim()
  const isValid = trimmed.length > 0 && trimmed.length <= NAME_MAX_LENGTH

  return (
    <div className="w-full flex flex-col gap-10 px-6 py-14 md:px-10 md:py-[60px] ">
      <div className="mx-auto flex max-w-[800px] w-full flex-col gap-10">
        <div className="flex flex-col gap-2.5 text-black">
          <Text variant="subtitle-32" className="font-medium">
            Last step before getting your certificate
          </Text>
          <Text variant="main-18" className="text-secondary">
            This name will appear on your certificate. It can be your real name, nickname, or address - whatever you
            want.
          </Text>
        </div>

        <div className="flex flex-col gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Put your name here"
            maxLength={NAME_MAX_LENGTH}
            className="h-[60px] bg-transparent text-black border-border placeholder:text-secondary"
          />
          <Text variant="caps-20" className="text-secondary text-right">
            {trimmed.length}/{NAME_MAX_LENGTH}
          </Text>
        </div>

        <Button type="button" onClick={() => onClaim(trimmed)} disabled={!isValid || isLoading} className="h-[60px]">
          Claim Certificate
        </Button>
      </div>
    </div>
  )
}
