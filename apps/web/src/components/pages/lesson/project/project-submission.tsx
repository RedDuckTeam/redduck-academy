import { useState } from 'react'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TerminalIcon } from '@/components/ui/icons/terminal'
import { ClipboardIcon } from '@/components/ui/icons/clipboard'

export function ProjectSubmission() {
  const [link, setLink] = useState('')

  const handleSubmit = () => {
    // Placeholder - backend submission deferred
  }

  const handlePaste = () => {
    navigator.clipboard.readText().then((text) => {
      setLink(text)
    })
  }

  return (
    <div className="flex flex-col w-fit gap-5">
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
          className="min-w-[420px]"
        />
        <button
          onClick={handlePaste}
          type="button"
          className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2"
        >
          <ClipboardIcon />
        </button>
      </div>
      <Button disabled={!link} onClick={handleSubmit} className="w-full">
        <Text variant="caps-20">SEND TO REVIEW</Text>
      </Button>
    </div>
  )
}
