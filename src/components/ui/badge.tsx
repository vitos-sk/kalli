import * as React from 'react'
import { cn } from '@/lib/utils'

function Badge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center border border-primary/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary',
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
