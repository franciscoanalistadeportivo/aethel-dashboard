'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Switch minimalista (sin Radix) — accessible via button[role=switch].
 */
const Switch = React.forwardRef(({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="switch"
    aria-checked={!!checked}
    data-state={checked ? 'checked' : 'unchecked'}
    disabled={disabled}
    onClick={() => onCheckedChange?.(!checked)}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:cursor-not-allowed disabled:opacity-50',
      checked
        ? 'bg-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_0_18px_-4px_hsl(var(--primary)/0.6)]'
        : 'bg-[hsl(var(--surface-2))] border-[hsl(var(--border-strong))]',
      className
    )}
    {...props}
  >
    <span
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )}
    />
  </button>
))
Switch.displayName = 'Switch'

export { Switch }
