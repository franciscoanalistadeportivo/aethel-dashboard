import { cn } from '@/lib/utils'

/**
 * Avatar con inicial — colorizado de forma determinística según el nombre.
 */
const PALETTE = [
  'from-emerald-500/30 to-emerald-600/10 text-emerald-200',
  'from-sky-500/30 to-sky-600/10 text-sky-200',
  'from-violet-500/30 to-violet-600/10 text-violet-200',
  'from-amber-500/30 to-amber-600/10 text-amber-200',
  'from-rose-500/30 to-rose-600/10 text-rose-200',
  'from-cyan-500/30 to-cyan-600/10 text-cyan-200',
  'from-fuchsia-500/30 to-fuchsia-600/10 text-fuchsia-200',
]

function hashCode(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0
  return Math.abs(h)
}

export function InitialAvatar({ name = '', className, size = 'md' }) {
  const letter = (name?.trim()?.[0] || '?').toUpperCase()
  const palette = PALETTE[hashCode(name || '?') % PALETTE.length]
  const sizeCls = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br font-semibold border border-[hsl(var(--border-strong))] shrink-0',
        palette,
        sizeCls,
        className
      )}
    >
      {letter}
    </div>
  )
}
