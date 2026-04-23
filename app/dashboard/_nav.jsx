'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Calendar, CalendarDays, Scissors, Clock, Users, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

const LINKS = [
  { href: '/dashboard',            label: 'Hoy',       icon: Calendar },
  { href: '/dashboard/agenda',     label: 'Agenda',    icon: CalendarDays },
  { href: '/dashboard/servicios',  label: 'Servicios', icon: Scissors },
  { href: '/dashboard/horarios',   label: 'Horarios',  icon: Clock },
  { href: '/dashboard/clientes',   label: 'Clientes',  icon: Users },
]

export default function DashboardNav({ nombre }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col md:border-r md:bg-background">
        <div className="p-4 border-b">
          <div className="text-lg font-bold text-primary">Aethel</div>
          <div className="text-sm text-muted-foreground truncate">{nombre}</div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>
            <LogOut className="h-4 w-4" />Salir
          </Button>
        </div>
      </aside>

      {/* Top bar mobile */}
      <header className="md:hidden sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">Aethel</span>
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">{nombre}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Bottom tabs mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background">
        <div className="grid grid-cols-5">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}>
                <Icon className="h-5 w-5" />{label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
