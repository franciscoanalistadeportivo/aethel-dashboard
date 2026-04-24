import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'border-primary/30 bg-primary/15 text-primary',
        secondary:
          'border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] text-muted-foreground',
        destructive:
          'border-red-500/30 bg-red-500/15 text-red-300',
        outline:
          'border-[hsl(var(--border))] text-foreground',
        success:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
        warning:
          'border-amber-500/30 bg-amber-500/15 text-amber-300',
        muted:
          'border-transparent bg-[hsl(var(--surface-2))] text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
