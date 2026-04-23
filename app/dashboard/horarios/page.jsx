'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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
    return horarios.find(h => h.dia_semana === dia) || { dia_semana: dia, hora_apertura: '09:00', hora_cierre: '20:00', activo: 0 }
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
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Horarios</h1>

      {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}

      <section className="space-y-2">
        <h2 className="font-semibold">Días de atención</h2>
        {DIAS.map((nombre, i) => {
          const h = getDia(i)
          return (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                <div className="w-24 font-medium">{nombre}</div>
                <Input type="time" className="w-28" value={(h.hora_apertura || '09:00').slice(0,5)}
                  onChange={e => guardarDia(i, { hora_apertura: e.target.value, hora_cierre: (h.hora_cierre || '20:00').slice(0,5), activo: h.activo })} />
                <span className="text-muted-foreground">–</span>
                <Input type="time" className="w-28" value={(h.hora_cierre || '20:00').slice(0,5)}
                  onChange={e => guardarDia(i, { hora_apertura: (h.hora_apertura || '09:00').slice(0,5), hora_cierre: e.target.value, activo: h.activo })} />
                <Button variant={h.activo ? 'default' : 'outline'} size="sm"
                  onClick={() => guardarDia(i, { hora_apertura: (h.hora_apertura || '09:00').slice(0,5), hora_cierre: (h.hora_cierre || '20:00').slice(0,5), activo: h.activo ? 0 : 1 })}>
                  {h.activo ? 'Abierto' : 'Cerrado'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Bloqueos (feriados, vacaciones, etc.)</h2>
          <NuevoBloqueoDialog onCreated={cargar} />
        </div>
        {bloqueos.length === 0 && (
          <Card><CardContent className="py-6 text-center text-muted-foreground text-sm">Sin bloqueos próximos.</CardContent></Card>
        )}
        {bloqueos.map(b => (
          <Card key={b.id}>
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="text-sm">
                <div className="font-medium">{b.fecha.slice(0,10)} · {b.hora_inicio.slice(0,5)}–{b.hora_fin.slice(0,5)}</div>
                {b.motivo && <div className="text-muted-foreground">{b.motivo}</div>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => borrarBloqueo(b.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

function NuevoBloqueoDialog({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ fecha: new Date().toISOString().slice(0,10), hora_inicio: '09:00', hora_fin: '20:00', motivo: '' })
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
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" />Bloquear</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Bloquear horario</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Fecha</Label>
            <Input required type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Desde</Label>
              <Input required type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Hasta</Label>
              <Input required type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Motivo (opcional)</Label>
            <Input value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} placeholder="Feriado, vacaciones..." />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear bloqueo'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
