'use client'

import { useRowLabel } from '@payloadcms/ui'

type RowData = { name?: string | null }

function makeRowLabel(prefix: string) {
  return function RowLabel() {
    const { data, rowNumber } = useRowLabel<RowData>()
    const fallback = `${prefix} ${(rowNumber ?? 0) + 1}`
    const name = data?.name?.trim()
    return <span>{name ? `${fallback} — ${name}` : fallback}</span>
  }
}

export const TestCaseRowLabel = makeRowLabel('Case')
export const StepRowLabel = makeRowLabel('Step')
