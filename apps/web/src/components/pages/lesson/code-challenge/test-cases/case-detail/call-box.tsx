import { cn } from '@/lib/utils'
import { formatCaller, formatSolidityArg, formatValue, formatValueWei } from '../utils'

interface CallBoxProps {
  functionName: string
  args: string[]
  valueWei?: string
  caller?: string
  variant?: 'main' | 'postCheck'
  /** Raw expected return value (as authored by admin). Renders an `expected:` line. */
  expected?: string
  /** Decoded actual return value, set when this step failed an assertion. */
  got?: unknown
  /** True when this is the failing step (assertion mismatch or revert). */
  failed?: boolean
  /** Revert / mismatch message for this step, when set. */
  errorMessage?: string
  /** Label substituted for `@self` in arg / caller display (typically the contract name). */
  selfLabel?: string
}

export function CallBox({
  functionName,
  args,
  valueWei,
  caller,
  variant = 'main',
  expected,
  got,
  failed,
  errorMessage,
  selfLabel,
}: CallBoxProps) {
  const formattedArgs = args.map((a) => formatSolidityArg(a, { selfLabel })).join(', ')
  const isPostCheck = variant === 'postCheck'
  const meta: string[] = []
  if (valueWei && valueWei.trim() !== '' && safeBigInt(valueWei) !== 0n) {
    meta.push(`value: ${formatValueWei(valueWei)}`)
  }
  if (caller && caller.trim() !== '') meta.push(`from: ${formatCaller(caller, { selfLabel })}`)

  const hasExpected = expected !== undefined && expected !== ''
  const isAssertionFail = failed && got !== undefined
  const isRevert = failed && got === undefined

  return (
    <div
      className={cn(
        'px-3 py-2 bg-muted flex flex-col gap-1',
        isPostCheck && 'opacity-80',
        failed && 'ring-1 ring-primary/40',
      )}
    >
      <pre className="text-[14px] leading-[18px] whitespace-pre-wrap break-all">
        <span>{functionName}</span>
        <span>(</span>
        <span>{formattedArgs}</span>
        <span>)</span>
      </pre>
      {meta.length > 0 && <div className="text-[12px] text-muted-foreground">{meta.join('  •  ')}</div>}

      {hasExpected && (
        <div
          className={cn(
            'text-[12px] leading-[16px] font-mono pl-3 break-all',
            isAssertionFail ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <span className="opacity-70">expected:</span> {expected}
        </div>
      )}

      {isAssertionFail && (
        <div className="text-[12px] leading-[16px] font-mono pl-3 break-all text-primary">
          <span className="opacity-70">got:</span> {formatValue(got)}
        </div>
      )}

      {isRevert && errorMessage && (
        <div className="text-[12px] leading-[16px] font-mono pl-3 break-all text-primary whitespace-pre-wrap">
          {errorMessage}
        </div>
      )}
    </div>
  )
}

function safeBigInt(value: string): bigint {
  try {
    return BigInt(value)
  } catch {
    return 0n
  }
}
