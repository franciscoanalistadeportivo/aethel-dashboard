'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Ban } from 'lucide-react'
import { startOfWeek, addDays, format, subWeeks, addWeeks, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const ESTADO_STYLE = {
  confirmada:  { bg: 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/20',           dot: 'bg-primary' },
  en_progreso: { bg: 'bg-amber-500/15 text-amber-200 border-amber-500/30 hover:bg-amber-500/20',  dot: 'bg-amber-400' },
  completada:  { bg: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/20', dot: 'bg-emerald-400' },
  cancelada:   { bg: 'bg-[hsl(var(--surface-2))] text-muted-foreground border-[hsl(var(--border))] line-through', dot: 'bg-zinc-500' },
  no_asistio:  { bg: 'bg-red-500/10 text-red-300 border-red-500/30',                               dot: 'bg-red-400' },
}

export default function AgendaSemanal() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [citas, setCitas] = useState([])
  const [bloqueos, setBloqueos] = useState([])
  const [loading, setLoading] = useState(true)

  const weekEnd = addDays(weekStart, 6)
  const dias = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hoy = new Date()

  const cargar = useCallback(async () => {
    setLoading(true)
    const desde = format(weekStart, 'yyyy-MM-dd')
    const hasta = format(weekEnd, 'yyyy-MM-dd')
    const [rCitas, rBloq] = await Promise.all([
      fetch(`/api/citas?desde=${desde}&hasta=${hasta}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/bloqueos?desde=${desde}&hasta=${hasta}`, { cache: 'no-store' }).then(r => r.json()),
    ])
    setCitas(rCitas.citas || [])
    setBloqueos(rBloq.bloqueos || [])
    setLoading(false)
  }, [weekStart])

  useEffect(() => { cargar() }, [cargar])

  async function cancelar(id) {
    if (!confirm('¿Cancelar esta cita?')) return
    await fetch(`/api/citas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'cancelada' }),
    })
    cargar()
  }

  function citasDe(fechaStr) { return citas.filter(c => c.fecha.slice(0, 10) === fechaStr) }
  function bloqDe(fechaStr)  { return bloqueos.filter(b => b.fecha.slice(0, 10) === fechaStr) }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Agenda</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1 capitalize">
            {format(weekStart, "MMMM yyyy", { locale: es })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoy
          </Button>
          <div className="flex items-center surface rounded-lg">
            <Button variant="ghost" size="icon" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-2 text-[13px] text-muted-foreground tabular whitespace-nowrap">
              {format(weekStart, "d MMM", { locale: es })} – {format(weekEnd, "d MMM", { locale: es })}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {/* ── Mobile: lista día por día ─────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {dias.map(d => {
          const fechaStr = format(d, 'yyyy-MM-dd')
          const delDia = citasDe(fechaStr)
          const bloqDia = bloqDe(fechaStr)
          const esHoy = isSameDay(d, hoy)
          return (
            <div key={fechaStr} className={cn('surface rounded-xl overflow-hidden', esHoy && 'ring-1 ring-primary/40')}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-2">
                  <div className={cn('h-8 w-8 rounded-md grid place-items-center text-sm font-semibold tabular',
                    esHoy ? 'bg-primary text-primary-foreground' : 'bg-[hsl(var(--surface-2))]'
                  )}>
                    {format(d, 'd')}
                  </div>
                  <div>
                    <div className="text-sm font-medium capitalize">{format(d, 'EEEE', { locale: es })}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {delDia.length} cita{delDia.length !== 1 ? 's' : ''}{bloqDia.length ? ` · ${bloqDia.length} bloqueo${bloqDia.length > 1 ? 's' : ''}` : ''}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                {delDia.length === 0 && bloqDia.length === 0 && (
                  <div className="text-xs text-muted-foreground/70 py-2 px-1">— Sin actividad</div>
                )}
                {bloqDia.map(b => (
                  <div key={`b${b.id}`} className="flex items-center gap-2 bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-xs">
                    <Ban className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="tabular">{b.hora_inicio.slice(0,5)}–{b.hora_fin.slice(0,5)}</span>
                    <span className="text-muted-foreground truncate">{b.motivo || 'Bloqueado'}</span>
                  </div>
                ))}
                {delDia.map(c => {
                  const st = ESTADO_STYLE[c.estado] || ESTADO_STYLE.confirmada
                  return (
                    <div
                      key={c.id}
                      onClick={() => c.estado === 'confirmada' && cancelar(c.id)}
                      className={cn('rounded-md border px-3 py-2 text-xs cursor-pointer transition-colors', st.bg)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn('dot', st.dot)} />
                          <span className="font-semibold tabular">{c.hora.slice(0,5)}</span>
                          <span className="truncate">{c.nombre_cliente}</span>
                        </div>
                      </div>
                      <div className="opacity-80 truncate mt-0.5 pl-4">{c.servicio_nombre}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Desktop: grid 7 columnas ──────────────────────────── */}
      <div className="hidden md:grid grid-cols-7 gap-2">
        {dias.map(d => {
          const fechaStr = format(d, 'yyyy-MM-dd')
          const delDia = citasDe(fechaStr)
          const bloqDia = bloqDe(fechaStr)
          const esHoy = isSameDay(d, hoy)
          return (
            <div key={fechaStr} className={cn('surface rounded-xl min-h-[320px] overflow-hidden', esHoy && 'ring-1 ring-primary/40')}>
              <div className={cn('px-3 py-2.5 border-b border-[hsl(var(--border))] flex items-center justify-between',
                esHoy && 'bg-primary/5'
              )}>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {format(d, 'EEE', { locale: es })}
                </div>
                <div className={cn('text-sm font-semibold tabular', esHoy && 'text-primary')}>
                  {format(d, 'd')}
                </div>
              </div>
              <div className="p-1.5 space-y-1">
                {bloqDia.map(b => (
                  <div key={`b${b.id}`} className="bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] rounded-md px-2 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                    <Ban className="h-3 w-3 shrink-0" />
                    <span className="tabular truncate">{b.hora_inicio.slice(0,5)}</span>
                  </div>
                ))}
                {delDia.map(c => {
                  const st = ESTADO_STYLE[c.estado] || ESTADO_STYLE.confirmada
                  return (
                    <div
                      key={c.id}
                      onClick={() => c.estado === 'confirmada' && cancelar(c.id)}
                      className={cn('rounded-md border px-2 py-1.5 text-[11px] cursor-pointer transition-all', st.bg)}
                      title="Click para cancelar"
                    >
                      <div className="flex items-center gap-1 font-semibold tabular">
                        <span className={cn('dot', st.dot)} />
                        {c.hora.slice(0,5)}
                      </div>
                      <div className="truncate mt-0.5">{c.nombre_cliente}</div>
                      <div className="truncate opacity-80">{c.servicio_nombre}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><span className="dot bg-primary" />Confirmada</span>
        <span className="flex items-center gap-1.5"><span className="dot bg-amber-400" />En atención</span>
        <span className="flex items-center gap-1.5"><span className="dot bg-emerald-400" />Completada</span>
        <span className="flex items-center gap-1.5"><span className="dot bg-red-400" />No asistió</span>
        <span className="flex items-center gap-1.5"><Ban className="h-3 w-3" />Bloqueo</span>
      </div>
    </div>
  )
}
