'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { startOfWeek, addDays, format, subWeeks, addWeeks } from 'date-fns'
import { es } from 'date-fns/locale'

const ESTADO_STYLES = {
  confirmada: 'bg-emerald-500/90',
  en_progreso: 'bg-amber-500/90',
  completada: 'bg-slate-500/80',
  cancelada: 'bg-slate-300',
  no_asistio: 'bg-red-500/80',
}

export default function AgendaSemanal() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [citas, setCitas] = useState([])
  const [bloqueos, setBloqueos] = useState([])
  const [loading, setLoading] = useState(true)

  const weekEnd = addDays(weekStart, 6)
  const dias = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

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

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Agenda</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(subWeeks(weekStart, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="text-sm font-medium min-w-[180px] text-center">
            {format(weekStart, "d 'de' MMMM", { locale: es })} — {format(weekEnd, "d 'de' MMMM", { locale: es })}
          </div>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}

      {/* Mobile: día por día. Desktop: grid 7 columnas */}
      <div className="space-y-3 md:hidden">
        {dias.map(d => {
          const fechaStr = format(d, 'yyyy-MM-dd')
          const delDia = citas.filter(c => c.fecha.slice(0, 10) === fechaStr)
          const bloqDia = bloqueos.filter(b => b.fecha.slice(0, 10) === fechaStr)
          return (
            <Card key={fechaStr}>
              <CardContent className="p-3 space-y-2">
                <div className="font-semibold capitalize">{format(d, "EEEE d", { locale: es })}</div>
                {delDia.length === 0 && bloqDia.length === 0 && (
                  <div className="text-sm text-muted-foreground">Sin citas</div>
                )}
                {bloqDia.map(b => (
                  <div key={`b${b.id}`} className="bg-slate-200 rounded-md px-2 py-1 text-xs">
                    🚫 {b.hora_inicio.slice(0,5)}–{b.hora_fin.slice(0,5)} · {b.motivo || 'Bloqueado'}
                  </div>
                ))}
                {delDia.map(c => (
                  <div key={c.id} className={`${ESTADO_STYLES[c.estado]} text-white rounded-md px-2 py-2 text-sm`}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{c.hora.slice(0,5)} · {c.nombre_cliente}</span>
                      {c.estado === 'confirmada' && (
                        <button onClick={() => cancelar(c.id)} className="text-xs underline">cancelar</button>
                      )}
                    </div>
                    <div className="text-xs opacity-90">{c.servicio_nombre}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="hidden md:grid grid-cols-7 gap-2">
        {dias.map(d => {
          const fechaStr = format(d, 'yyyy-MM-dd')
          const delDia = citas.filter(c => c.fecha.slice(0, 10) === fechaStr)
          const bloqDia = bloqueos.filter(b => b.fecha.slice(0, 10) === fechaStr)
          return (
            <Card key={fechaStr} className="min-h-[320px]">
              <CardContent className="p-2">
                <div className="text-center font-semibold mb-2 capitalize text-sm">
                  {format(d, "EEE d", { locale: es })}
                </div>
                <div className="space-y-1.5">
                  {bloqDia.map(b => (
                    <div key={`b${b.id}`} className="bg-slate-200 rounded-md px-2 py-1 text-xs">
                      🚫 {b.hora_inicio.slice(0,5)}
                    </div>
                  ))}
                  {delDia.map(c => (
                    <div key={c.id} className={`${ESTADO_STYLES[c.estado]} text-white rounded-md px-2 py-1.5 text-xs cursor-pointer hover:opacity-90`}
                         onClick={() => c.estado === 'confirmada' && cancelar(c.id)} title="Click para cancelar">
                      <div className="font-semibold">{c.hora.slice(0,5)}</div>
                      <div className="truncate">{c.nombre_cliente}</div>
                      <div className="truncate opacity-90">{c.servicio_nombre}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
