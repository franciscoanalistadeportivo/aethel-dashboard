'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Trash2, Ban, CalendarX } from 'lucide-react'
import { cn } from '@/lib/utils'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function HorariosPage() {
  const [horarios, setHorarios] = useState([])
  const [bloqueos, setBloqueos] = useState([])
  const [loading, setLoading] = useState(true)

  async function cargar() {
    setLoading(true)
    const [rH, rB] = await Promise.all([
      fetch('/api/horarios', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/bloqueos', { cache: 'no-store' }).then(r => r.json()),
    ])
    setHorarios(rH.horarios || [])
    setBloqueos(rB.bloqueos || [])
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  function getDia(dia) {
    return horarios.find(h => h.dia_semana === dia) ||
           { dia_semana: dia, hora_apertura: '09:00', hora_cierre: '20:00', activo: 0 }
  }

  async function guardarDia(dia, payload) {
    await fetch('/api/horarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dia_semana: dia, ...payload }),
    })
    cargar()
  }

  async function borrarBloqueo(id) {
    if (!confirm('¿Eliminar este bloqueo?')) return
    await fetch(`/api/bloqueos?id=${id}`, { method: 'DELETE' })
    cargar()
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Configuración</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">Horarios</h1>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {/* Días de atención */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Días de atención</h2>
          <p className="text-xs text-muted-foreground">Toca para abrir/cerrar</p>
        </div>
        <div className="surface rounded-xl overflow-hidden divide-y divide-[hsl(var(--border))]">
          {DIAS.map((nombre, i) => {
            const h = getDia(i)
            const isOpen = !!h.activo
            const apertura = (h.hora_apertura || '09:00').slice(0, 5)
            const cierre = (h.hora_cierre || '20:00').slice(0, 5)
            return (
              <div key={i} className={cn('px-4 md:px-5 py-3.5 flex items-center gap-3 md:gap-4 flex-wrap md:flex-nowrap', !isOpen && 'opacity-60')}>
                <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[160px]">
                  <Switch
                    checked={isOpen}
                    onCheckedChange={(v) => guardarDia(i, { hora_apertura: apertura, hora_cierre: cierre, activo: v ? 1 : 0 })}
                  />
                  <div>
                    <div className="font-medium leading-tight">{nombre}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      {isOpen ? <span className="text-primary">Abierto</span> : 'Cerrado'}
                    </div>
                  </div>
                </div>

                <div className={cn('flex items-center gap-2 ml-auto', !isOpen && 'pointer-events-none')}>
                  <Input
                    type="time"
                    className="w-28 tabular"
                    value={apertura}
                    onChange={e => guardarDia(i, { hora_apertura: e.target.value, hora_cierre: cierre, activo: h.activo })}
                  />
                  <span className="text-muted-foreground text-sm">→</span>
                  <Input
                    type="time"
                    className="w-28 tabular"
                    value={cierre}
                    onChange={e => guardarDia(i, { hora_apertura: apertura, hora_cierre: e.target.value, activo: h.activo })}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Bloqueos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Bloqueos</h2>
            <p className="text-xs text-muted-foreground">Feriados, vacaciones, pausas</p>
          </div>
          <NuevoBloqueoDialog onCreated={cargar} />
        </div>

        {bloqueos.length === 0 ? (
          <div className="surface rounded-xl py-10 px-6 text-center">
            <div className="inline-flex h-11 w-11 rounded-2xl items-center justify-center bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] mb-3">
              <CalendarX className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Sin bloqueos próximos.</p>
          </div>
        ) : (
          <div className="surface rounded-xl overflow-hidden divide-y divide-[hsl(var(--border))]">
            {bloqueos.map(b => {
              const d = new Date(b.fecha)
              return (
                <div key={b.id} className="px-4 md:px-5 py-3.5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 grid place-items-center shrink-0">
                    <Ban className="h-4 w-4 text-red-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {DIAS_CORTOS[d.getDay()]} {String(b.fecha).slice(0, 10)}
                      <span className="text-muted-foreground font-normal ml-2 tabular">
                        {b.hora_inicio.slice(0, 5)}–{b.hora_fin.slice(0, 5)}
                      </span>
                    </div>
                    {b.motivo && <div className="text-xs text-muted-foreground truncate mt-0.5">{b.motivo}</div>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => borrarBloqueo(b.id)} aria-label="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function NuevoBloqueoDialog({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    hora_inicio: '09:00', hora_fin: '20:00', motivo: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/bloqueos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Error')
      setOpen(false); onCreated?.()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4" />Bloquear</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear horario</DialogTitle>
          <DialogDescription>El bot no agendará citas durante este rango.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fecha</Label>
            <Input required type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Desde</Label>
              <Input required type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hasta</Label>
              <Input required type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Motivo (opcional)</Label>
            <Input value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} placeholder="Feriado, vacaciones…" />
          </div>
          {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? 'Creando…' : 'Crear bloqueo'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
