import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-11 w-full rounded-lg border border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-2))] px-3 py-2 text-[15px] text-foreground ring-offset-background',
      'placeholder:text-muted-foreground/60',
      'transition-colors duration-150',
      'focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0',
      'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
