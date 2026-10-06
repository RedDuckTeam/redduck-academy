import { Text } from '@/components/ui/text'
import { BaseTooltip } from '@/components/ui/base-tooltip'

export const IN_PROGRESS_LABEL = 'More lessons coming'

const IN_PROGRESS_EXPLANATION = "You'll be able to earn a certificate once we've finished writing this course."

const darkIcon = (
  <span
    className="inline-flex size-4.5 shrink-0 items-center justify-center rounded-none border border-[#000] text-[14px] font-semibold leading-none text-[#000]"
    aria-hidden
  >
    ?
  </span>
)

export function InProgressCourseBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-primary px-4 py-2">
      <Text variant="caps-14" className="text-[#000]">
        {IN_PROGRESS_LABEL}
      </Text>
      <BaseTooltip
        triggerLabel="Why can't I get a certificate?"
        contentClassName="max-w-xs text-left text-sm font-normal normal-case leading-snug"
        icon={darkIcon}
      >
        <p>{IN_PROGRESS_EXPLANATION}</p>
      </BaseTooltip>
    </div>
  )
}
