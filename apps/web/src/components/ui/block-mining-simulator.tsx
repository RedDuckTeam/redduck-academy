import { useCallback, useEffect, useRef, useState } from 'react'
import { Hammer, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

const DIFFICULTY_PREFIX = '0000'

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function buildPayload(block: number, nonce: number, data: string): string {
  return `${block}${nonce}${data}`
}

interface BlockMiningSimulatorProps {
  initialBlock?: number
  initialData?: string
}

export function BlockMiningSimulator({ initialBlock = 1, initialData = '' }: BlockMiningSimulatorProps) {
  const [block, setBlock] = useState(initialBlock)
  const [nonce, setNonce] = useState(0)
  const [data, setData] = useState(initialData)
  const [hash, setHash] = useState('')
  const [isMining, setIsMining] = useState(false)
  const miningCancelRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    void sha256(buildPayload(block, nonce, data)).then((h) => {
      if (!cancelled) setHash(h)
    })
    return () => {
      cancelled = true
    }
  }, [block, nonce, data])

  const isValid = hash.startsWith(DIFFICULTY_PREFIX)

  const handleMine = useCallback(async () => {
    if (isMining) {
      miningCancelRef.current = true
      return
    }
    setIsMining(true)
    miningCancelRef.current = false
    let candidate = nonce
    while (!miningCancelRef.current) {
      const h = await sha256(buildPayload(block, candidate, data))
      if (h.startsWith(DIFFICULTY_PREFIX)) {
        setNonce(candidate)
        setHash(h)
        break
      }
      candidate += 1
      // Yield to the event loop every 200 iterations so the UI stays responsive.
      if (candidate % 200 === 0) {
        await new Promise((r) => setTimeout(r, 0))
      }
    }
    setIsMining(false)
    miningCancelRef.current = false
  }, [block, data, isMining, nonce])

  return (
    <div
      className={cn(
        'my-4 flex w-full flex-col gap-4 border border-border p-5',
        isValid ? 'border-success' : 'border-destructive-light',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Text variant="caps-20" element="span" className="font-medium">
          Block mining
        </Text>
        <Text
          variant="main-14"
          element="span"
          className={cn('uppercase tracking-widest', isValid ? 'text-success' : 'text-destructive-light')}
        >
          {isValid ? 'Valid' : 'Invalid'}
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr]">
        <label className="flex flex-col gap-1.5">
          <Text variant="main-14" element="span" className="text-muted-foreground">
            Block
          </Text>
          <Input type="number" min={0} value={block} onChange={(e) => setBlock(Number(e.target.value) || 0)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <Text variant="main-14" element="span" className="text-muted-foreground">
            Nonce
          </Text>
          <Input type="number" min={0} value={nonce} onChange={(e) => setNonce(Number(e.target.value) || 0)} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <Text variant="main-14" element="span" className="text-muted-foreground">
          Data
        </Text>
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          rows={3}
          className="flex w-full border border-border bg-transparent px-4 py-2.5 text-base text-foreground outline-none transition-colors duration-100 placeholder:text-muted-foreground"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <Text variant="main-14" element="span" className="text-muted-foreground">
          Hash
        </Text>
        <div
          className={cn(
            'break-all border border-border bg-background px-4 py-2.5 font-mono text-[14px] leading-relaxed',
            isValid ? 'text-success' : 'text-foreground',
          )}
        >
          {hash || ' '}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Text variant="main-14" element="span" className="text-muted-foreground">
          Target: hash starts with <span className="font-mono">{DIFFICULTY_PREFIX}</span>
        </Text>
        <Button type="button" size="sm" onClick={handleMine} className="gap-2">
          {isMining ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Stop
            </>
          ) : (
            <>
              <Hammer className="size-4" />
              Mine
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
