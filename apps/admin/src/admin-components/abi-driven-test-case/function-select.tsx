'use client'

import { FunctionSelectBase } from './function-select-base'

interface FunctionSelectProps {
  path: string
}

export function FunctionSelect({ path }: FunctionSelectProps) {
  return <FunctionSelectBase path={path} label="Function" description="Select the function to call." />
}
