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
  const [toast, setToast] = useState('')

  async function cargar() {
    setLoading(true)
    try {
      const [rH, rB] = await Promise.all([
        fetch('/api/horarios', { cache: 'no-store' }).then(async r => {
          const d = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(d.error || `GET /api/horarios ${r.status}`)
          return d
        }),
        fetch('/api/bloqueos', { cache: 'no-store' }).then(async r => {
          const d = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(d.error || `GET /api/bloqueos ${r.status}`)
          return d
        }),
      ])
      setHorarios(rH.horarios || [])
      setBloqueos(rB.bloqueos || [])
      setToast('')
    } catch (e) {
      setToast(`${e.message}. ¿Corriste \`npm run schema\`?`)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { cargar() }, [])

  function getDia(dia) {
    return horarios.find(h => h.dia_semana === dia) ||
           { dia_semana: dia, hora_apertura: '09:00', hora_cierre: '20:00', activo: 0 }
  }

  // Optimistic update: pone el estado local al instante y después persiste.
  // Si la API falla, revierte y muestra el error.
  async function guardarDia(dia, payload) {
    const prev = horarios
    const updated = { dia_semana: dia, ...payload }
    setHorarios(curr => {
      const idx = curr.findIndex(h => h.dia_semana === dia)
      if (idx === -1) return [...curr, updated]
      const next = [...curr]; next[idx] = { ...next[idx], ...updated }
      return next
    })
    try {
      const res = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || `Error ${res.status}`)
      setToast('')
    } catch (e) {
      setHorarios(prev) // rollback
      setToast(`No se pudo guardar: ${e.message}`)
    }
  }

  async function borrarBloqueo(id) {
    if (!confirm('¿Eliminar este bloqueo?')) return
    try {
      const res = await fetch(`/api/bloqueos?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      cargar()
    } catch (e) {
      setToast(`No se pudo eliminar: ${e.message}`)
    }
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Configuración</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">Horarios</h1>
      </div>

      {toast && (
        <div className="surface rounded-lg px-4 py-3 border-red-500/30 bg-red-500/10 text-sm text-red-200 flex items-start gap-3">
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast('')} className="text-red-200 hover:text-red-100 text-xs" aria-label="Cerrar">✕</button>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {/* Días de atención */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Días de atención</h2>
          <p className="text-xs text-muted-foreground">Toca para abrir/cerrar</p>
        </div>
        <div className="surface rounded-xl overflow-hidden divide-y divide-[hsl(var(--border))]">
          {DIAS.map((nombre, i) => (
            <DiaRow
              key={i}
              dia={i}
              nombre={nombre}
              horario={getDia(i)}
              onSave={guardarDia}
            />
          ))}
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

/**
 * Fila de configuración de día.
 * Estado local (draft) para permitir editar los time inputs sin que cada tecla dispare
 * un fetch (lo cual rompía la edición porque el onChange recargaba desde server).
 * Guarda en onBlur o con Enter, y el switch guarda inmediato.
 */
function DiaRow({ dia, nombre, horario, onSave }) {
  const apertura0 = (horario.hora_apertura || '09:00').slice(0, 5)
  const cierre0 = (horario.hora_cierre || '20:00').slice(0, 5)
  const isOpen = !!horario.activo

  const [apertura, setApertura] = useState(apertura0)
  const [cierre, setCierre] = useState(cierre0)

  // Si el server devuelve valores nuevos (ej. tras otra edición), sincronizamos — pero
  // solo cuando el usuario NO tiene foco activo sobre los inputs (protege la edición).
  useEffect(() => {
    setApertura(apertura0)
    setCierre(cierre0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apertura0, cierre0])

  function persistirSi(payload) {
    // Validaciones locales para no pedir guardado inválido al server
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(payload.hora_apertura)) return
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(payload.hora_cierre)) return
    if (payload.hora_cierre <= payload.hora_apertura) return
    onSave(dia, payload)
  }

  return (
    <div className={cn('px-4 md:px-5 py-3.5 flex items-center gap-3 md:gap-4 flex-wrap md:flex-nowrap', !isOpen && 'opacity-70')}>
      <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[160px]">
        <Switch
          checked={isOpen}
          onCheckedChange={(v) => onSave(dia, { hora_apertura: apertura, hora_cierre: cierre, activo: v ? 1 : 0 })}
        />
        <div>
          <div className="font-medium leading-tight">{nombre}</div>
          <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            {isOpen ? <span className="text-primary">Abierto</span> : 'Cerrado'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Input
          type="time"
          className="w-28 tabular"
          value={apertura}
          onChange={e => setApertura(e.target.value)}
          onBlur={() => apertura !== apertura0 && persistirSi({ hora_apertura: apertura, hora_cierre: cierre, activo: horario.activo })}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        />
        <span className="text-muted-foreground text-sm">→</span>
        <Input
          type="time"
          className="w-28 tabular"
          value={cierre}
          onChange={e => setCierre(e.target.value)}
          onBlur={() => cierre !== cierre0 && persistirSi({ hora_apertura: apertura, hora_cierre: cierre, activo: horario.activo })}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        />
      </div>
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
