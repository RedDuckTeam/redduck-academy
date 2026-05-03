'use client'

import { FunctionSelectBase } from './function-select-base'

interface PostCheckFunctionSelectProps {
  path: string
}

/**
 * Function dropdown limited to `view` / `pure` functions — the runner calls these
 * statically, so state-changing fns would revert.
 */
export function PostCheckFunctionSelect({ path }: PostCheckFunctionSelectProps) {
  return (
    <FunctionSelectBase
      path={path}
      label="Post-check function"
      description="View / pure function called after the main call to verify state."
      mutabilityFilter={['view', 'pure']}
    />
  )
}
