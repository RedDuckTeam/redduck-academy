import { useState } from 'react'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FileIcon } from '@/components/ui/icons/file'
import { TerminalIcon } from '@/components/ui/icons/terminal'

export function ProjectSubmission() {
  const [link, setLink] = useState('')

  const handleSubmit = () => {
    // Placeholder - backend submission deferred
  }

  return (
    <div className="flex flex-col gap-5">
      <Text variant="caps-24" className="font-medium">
        YOUR WORK
      </Text>
      <div className="flex items-center gap-2">
        <TerminalIcon className="" />
        <Text variant="main-18">Paste link to repository</Text>
      </div>
      <div className="relative">
        <Input
          type="url"
          placeholder="https://"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full"
        />
      </div>
      <Button onClick={handleSubmit} className="w-full">
        <Text variant="caps-20">SEND TO REVIEW</Text>
      </Button>
    </div>
  )
}
