import { aliasForAddress } from '@redduck/solc-utils/src/caller-aliases'
import { cn } from '@/lib/utils'
import { formatCaller, formatExpected, formatGot, formatSolidityArg, formatTargetPrefix, formatValueWei } from '../utils'

interface CallBoxProps {
  functionName: string
  args: string[]
  valueWei?: string
  caller?: string
  /** Raw target alias / address. `@self` and blank render no prefix (call is on the student's contract). */
  target?: string
  variant?: 'main' | 'postCheck'
  /** Raw expected return value (as authored by admin). Renders an `expected:` line. */
  expected?: string
  /** Raw expected revert reason (as authored by admin). Renders an `expected revert:` line. */
  expectedRevert?: string
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
  target,
  variant = 'main',
  expected,
  expectedRevert,
  got,
  failed,
  errorMessage,
  selfLabel,
}: CallBoxProps) {
  const formattedArgs = args.map((a) => formatSolidityArg(a, { selfLabel })).join(', ')
  const targetPrefix = formatTargetPrefix(target)
  const isPostCheck = variant === 'postCheck'
  const meta: string[] = []
  if (valueWei && valueWei.trim() !== '' && safeBigInt(valueWei) !== 0n) {
    meta.push(`value: ${formatValueWei(valueWei)}`)
  }
  // Only surface `from:` when the call uses a non-default caller. Blank, `@deployer`,
  // or the raw deployer address all mean "the default EOA", so we omit the line.
  const trimmedCaller = caller?.trim() ?? ''
  const callerAlias = trimmedCaller.startsWith('@')
    ? trimmedCaller.slice(1).toLowerCase()
    : aliasForAddress(trimmedCaller)
  const isDefaultCaller = trimmedCaller === '' || callerAlias === 'deployer'
  if (!isDefaultCaller) {
    meta.push(`from: ${formatCaller(trimmedCaller, { selfLabel })}`)
  }

  const hasExpected = expected !== undefined && expected !== ''
  const hasExpectedRevert = expectedRevert !== undefined && expectedRevert !== ''
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
        {targetPrefix && (
          <>
            <span className="text-muted-foreground">{targetPrefix}</span>
            <span className="text-muted-foreground">.</span>
          </>
        )}
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
          <span className="opacity-70">expected:</span> {formatExpected(expected ?? '', { selfLabel })}
        </div>
      )}

      {hasExpectedRevert && (
        <div
          className={cn(
            'text-[12px] leading-[16px] font-mono pl-3 break-all',
            failed ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <span className="opacity-70">expected revert:</span> {expectedRevert}
        </div>
      )}

      {isAssertionFail && (
        <div className="text-[12px] leading-[16px] font-mono pl-3 break-all text-primary">
          <span className="opacity-70">got:</span> {formatGot(got)}
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
