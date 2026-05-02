import type { ComponentType, SVGProps } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface IconButtonProps {
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  tooltip: string
  onClick: () => void
}

export function IconButton({ Icon, tooltip, onClick }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-black" onClick={onClick}>
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
