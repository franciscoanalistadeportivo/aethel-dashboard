'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Plus, BellRing, Clock, Phone, Scissors,
  CalendarCheck, CircleDollarSign, TrendingUp, UserCheck
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { InitialAvatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const ESTADO_STYLES = {
  confirmada:  { label: 'Confirmada',  variant: 'default',     accent: 'bg-primary',      dot: 'bg-primary' },
  en_progreso: { label: 'En atención', variant: 'warning',     accent: 'bg-amber-500',    dot: 'bg-amber-400' },
  completada:  { label: 'Completada',  variant: 'success',     accent: 'bg-emerald-500',  dot: 'bg-emerald-400' },
  cancelada:   { label: 'Cancelada',   variant: 'secondary',   accent: 'bg-muted',        dot: 'bg-zinc-500' },
  no_asistio:  { label: 'No asistió',  variant: 'destructive', accent: 'bg-red-500',      dot: 'bg-red-400' },
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

  // Métricas del día
  const metricas = useMemo(() => {
    const total = citas.length
    const completadas = citas.filter(c => c.estado === 'completada').length
    const activas = citas.filter(c => c.estado === 'confirmada' || c.estado === 'en_progreso').length
    const ingresos = citas
      .filter(c => c.estado === 'completada')
      .reduce((s, c) => s + Number(c.precio || 0), 0)
    const unicos = new Set(citas.map(c => c.telefono)).size
    return { total, completadas, activas, ingresos, unicos }
  }, [citas])

  const hoyStr = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Hoy</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight capitalize mt-1">
            {hoyStr}
          </h1>
        </div>
        <CrearCitaDialog onCreated={cargar} />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={CalendarCheck} label="Citas hoy"    value={metricas.total} />
        <Metric icon={UserCheck}     label="Activas"      value={metricas.activas} accent />
        <Metric icon={TrendingUp}    label="Completadas"  value={metricas.completadas} />
        <Metric icon={CircleDollarSign} label="Ingresos"  value={formatCLP(metricas.ingresos)} />
      </div>

      {/* Alerta nueva cita bot */}
      {alertOpen && (
        <div className="surface rounded-xl p-4 flex items-center gap-3 glow-primary">
          <div className="h-9 w-9 rounded-full bg-primary/15 grid place-items-center shrink-0">
            <BellRing className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">Nueva cita por WhatsApp</div>
            <div className="text-xs text-muted-foreground">El bot acaba de agendar una reserva</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAlertOpen(false)}>OK</Button>
        </div>
      )}

      {/* Lista de citas */}
      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {!loading && citas.length === 0 && (
        <div className="surface rounded-xl py-14 px-6 text-center">
          <div className="inline-flex h-12 w-12 rounded-2xl items-center justify-center bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] mb-4">
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No hay citas para hoy.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Cuando alguien reserve por WhatsApp aparecerá acá.</p>
        </div>
      )}

      <div className="space-y-2.5">
        {citas.map((c) => {
          const est = ESTADO_STYLES[c.estado] || ESTADO_STYLES.confirmada
          const isNew = newIds.has(c.id)
          return (
            <div
              key={c.id}
              className={cn(
                'surface rounded-xl overflow-hidden flex',
                'transition-all duration-200 hover:border-[hsl(var(--border-strong))]',
                isNew && 'ring-1 ring-primary/50 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]'
              )}
            >
              {/* Status accent bar */}
              <div className={cn('w-1 shrink-0', est.accent)} />

              <div className="flex-1 p-4 md:p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <InitialAvatar name={c.nombre_cliente} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{c.nombre_cliente}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{c.telefono}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5 text-lg font-semibold tabular">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {c.hora?.slice(0, 5)}
                    </div>
                    <Badge variant={est.variant}>
                      <span className={cn('dot', est.dot)} />
                      {est.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                    <Scissors className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{c.servicio_nombre}</span>
                  </div>
                  <div className="text-foreground font-medium tabular shrink-0">{formatCLP(c.precio)}</div>
                </div>

                {c.estado === 'confirmada' && (
                  <div className="flex gap-2 flex-wrap mt-4">
                    <Button size="sm" onClick={() => cambiarEstado(c.id, 'en_progreso')}>Iniciar</Button>
                    <Button size="sm" variant="outline" onClick={() => cambiarEstado(c.id, 'no_asistio')}>No asistió</Button>
                    <Button size="sm" variant="ghost" onClick={() => cambiarEstado(c.id, 'cancelada')}>Cancelar</Button>
                  </div>
                )}
                {c.estado === 'en_progreso' && (
                  <div className="mt-4">
                    <Button size="sm" onClick={() => cambiarEstado(c.id, 'completada')}>Completar</Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, accent }) {
  return (
    <div className={cn(
      'surface rounded-xl p-4 transition-colors hover:border-[hsl(var(--border-strong))]',
      accent && 'bg-gradient-to-br from-primary/5 to-transparent border-primary/20'
    )}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular">{value}</div>
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
          <DialogDescription>Verificamos disponibilidad automáticamente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nombre cliente</Label>
            <Input required value={form.nombre_cliente} onChange={e => setForm(f => ({ ...f, nombre_cliente: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Teléfono</Label>
            <Input required type="tel" inputMode="tel" placeholder="+56912345678"
              value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Servicio</Label>
            <Select value={form.servicio_id} onValueChange={v => setForm(f => ({ ...f, servicio_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Elegí…" /></SelectTrigger>
              <SelectContent>
                {servicios.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nombre} — {formatCLP(s.precio)} · {s.duracion_min} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fecha</Label>
              <Input required type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hora</Label>
              <Input required type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
            </div>
          </div>
          {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={loading || !form.servicio_id}>{loading ? 'Creando…' : 'Crear cita'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
