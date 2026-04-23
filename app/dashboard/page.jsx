'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, BellRing, Clock, Phone, Scissors } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ESTADO_STYLES = {
  confirmada:  { label: 'Confirmada',  variant: 'default' },
  en_progreso: { label: 'En atención', variant: 'warning' },
  completada:  { label: 'Completada',  variant: 'success' },
  cancelada:   { label: 'Cancelada',   variant: 'secondary' },
  no_asistio:  { label: 'No asistió',  variant: 'destructive' },
}

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0)
}

export default function DashboardHoy() {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [newIds, setNewIds] = useState(new Set())
  const [alertOpen, setAlertOpen] = useState(false)
  const prevIdsRef = useRef(new Set())

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/citas', { cache: 'no-store' })
      const data = await res.json()
      const nuevas = data.citas || []

      // Detectar citas nuevas (que no estaban antes)
      const prev = prevIdsRef.current
      const actualIds = new Set(nuevas.map((c) => c.id))
      const recien = [...actualIds].filter((id) => !prev.has(id))
      if (prev.size > 0 && recien.length > 0) {
        setNewIds(new Set(recien))
        setAlertOpen(true)
        setTimeout(() => setNewIds(new Set()), 8000)
      }
      prevIdsRef.current = actualIds
      setCitas(nuevas)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, 15000)
    return () => clearInterval(id)
  }, [cargar])

  async function cambiarEstado(citaId, estado) {
    await fetch(`/api/citas/${citaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    await cargar()
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Hoy</h1>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <CrearCitaDialog onCreated={cargar} />
      </div>

      {alertOpen && (
        <Card className="bg-primary/10 border-primary animate-pulse-ring">
          <CardContent className="flex items-center gap-3 py-3">
            <BellRing className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="font-semibold">Nueva cita por WhatsApp</div>
              <div className="text-sm text-muted-foreground">Llegó una reserva del bot</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAlertOpen(false)}>OK</Button>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {!loading && citas.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No hay citas para hoy.</CardContent></Card>
      )}

      <div className="space-y-3">
        {citas.map((c) => {
          const est = ESTADO_STYLES[c.estado] || { label: c.estado, variant: 'secondary' }
          const isNew = newIds.has(c.id)
          return (
            <Card key={c.id} className={isNew ? 'ring-2 ring-primary animate-pulse-ring' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xl font-bold">
                    <Clock className="h-5 w-5" />{c.hora?.slice(0, 5)}
                  </div>
                  <Badge variant={est.variant}>{est.label}</Badge>
                </div>
                <div className="space-y-1 mb-3">
                  <div className="font-semibold text-lg">{c.nombre_cliente}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{c.telefono}</div>
                  <div className="text-sm flex items-center gap-2"><Scissors className="h-3.5 w-3.5" />{c.servicio_nombre} · {formatCLP(c.precio)}</div>
                </div>
                {c.estado === 'confirmada' && (
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => cambiarEstado(c.id, 'en_progreso')}>Iniciar</Button>
                    <Button size="sm" variant="outline" onClick={() => cambiarEstado(c.id, 'no_asistio')}>No asistió</Button>
                    <Button size="sm" variant="ghost" onClick={() => cambiarEstado(c.id, 'cancelada')}>Cancelar</Button>
                  </div>
                )}
                {c.estado === 'en_progreso' && (
                  <Button size="sm" onClick={() => cambiarEstado(c.id, 'completada')}>Completar</Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function CrearCitaDialog({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre_cliente: '', telefono: '', servicio_id: '',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '10:00',
  })

  useEffect(() => {
    if (!open) return
    fetch('/api/servicios').then(r => r.json()).then(d => setServicios(d.servicios || []))
  }, [open])

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setOpen(false)
      setForm(f => ({ ...f, nombre_cliente: '', telefono: '' }))
      onCreated?.()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg"><Plus className="h-4 w-4" />Nueva cita</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cita manual</DialogTitle>
          <DialogDescription>Verifica disponibilidad automática.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Nombre cliente</Label>
            <Input required value={form.nombre_cliente} onChange={e => setForm(f => ({ ...f, nombre_cliente: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Teléfono</Label>
            <Input required type="tel" inputMode="tel" placeholder="+56912345678"
              value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Servicio</Label>
            <Select value={form.servicio_id} onValueChange={v => setForm(f => ({ ...f, servicio_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Elegí..." /></SelectTrigger>
              <SelectContent>
                {servicios.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nombre} — {formatCLP(s.precio)} · {s.duracion_min} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input required type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Hora</Label>
              <Input required type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
            </div>
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={loading || !form.servicio_id}>{loading ? 'Creando...' : 'Crear cita'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
