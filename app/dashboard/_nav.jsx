'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Calendar, CalendarDays, Scissors, Clock, Users, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

const LINKS = [
  { href: '/dashboard',           label: 'Hoy',       icon: Calendar },
  { href: '/dashboard/agenda',    label: 'Agenda',    icon: CalendarDays },
  { href: '/dashboard/servicios', label: 'Servicios', icon: Scissors },
  { href: '/dashboard/horarios',  label: 'Horarios',  icon: Clock },
  { href: '/dashboard/clientes',  label: 'Clientes',  icon: Users },
]

function isActive(pathname, href) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
}

export default function DashboardNav({ nombre }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  return (
    <>
      {/* ─── Sidebar desktop ──────────────────────────────────────── */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex-col md:border-r md:border-[hsl(var(--border))] md:bg-[hsl(var(--surface))]/60 md:backdrop-blur">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 grid place-items-center">
              <Scissors className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="font-semibold tracking-tight">Aethel</div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground truncate">{nombre}</div>
        </div>

        <nav className="px-3 pt-2 space-y-0.5">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-150',
                  active
                    ? 'bg-[hsl(var(--surface-2))] text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-2))]/60'
                )}
              >
                <Icon className={cn('h-4 w-4 transition-colors', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                <span>{label}</span>
                {active && <span className="ml-auto dot bg-primary animate-pulse" />}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto p-3 border-t border-[hsl(var(--border))]">
          <Button variant="ghost" className="w-full justify-start gap-2 h-10" onClick={logout}>
            <LogOut className="h-4 w-4" />
            <span className="text-[13px]">Salir</span>
          </Button>
        </div>
      </aside>

      {/* ─── Top bar mobile ──────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-background/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-emerald-600 grid place-items-center">
              <Scissors className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Aethel</div>
              <div className="text-[10px] text-muted-foreground leading-tight truncate max-w-[160px]">{nombre}</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Salir">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ─── Bottom nav mobile ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn('relative', active && 'after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-6 after:rounded-full after:bg-primary')}>
                  <Icon className="h-5 w-5" />
                </div>
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
