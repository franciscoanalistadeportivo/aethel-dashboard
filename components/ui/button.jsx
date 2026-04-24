import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_8px_24px_-6px_hsl(var(--primary)/0.55)] hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_10px_30px_-6px_hsl(var(--primary)/0.7)] hover:brightness-110',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-[hsl(var(--border-strong))] bg-transparent hover:bg-[hsl(var(--surface-2))] hover:border-[hsl(var(--border-strong))]',
        secondary:
          'bg-[hsl(var(--surface-2))] text-foreground border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface))]',
        ghost:
          'text-muted-foreground hover:bg-[hsl(var(--surface-2))] hover:text-foreground',
        link:
          'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-4 py-2 min-w-[44px]',
        sm: 'h-9 rounded-md px-3 min-w-[36px] text-[13px]',
        lg: 'h-12 rounded-lg px-6 text-base min-w-[48px]',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = 'Button'

export { Button, buttonVariants }
