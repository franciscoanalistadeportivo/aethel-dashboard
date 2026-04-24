'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription
} from '@/components/ui/dialog'
import { Plus, Pencil, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0)
}

export default function ServiciosPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | {...servicio}

  async function cargar() {
    setLoading(true)
    const r = await fetch('/api/servicios?todos=1', { cache: 'no-store' })
    const d = await r.json()
    setItems(d.servicios || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  async function toggleActivo(s) {
    await fetch(`/api/servicios/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !s.activo }),
    })
    cargar()
  }

  const activos = items.filter(s => s.activo)
  const inactivos = items.filter(s => !s.activo)

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Configuración</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">Servicios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activos.length} activo{activos.length !== 1 ? 's' : ''}{inactivos.length > 0 && ` · ${inactivos.length} inactivo${inactivos.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Nuevo</Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {!loading && items.length === 0 && (
        <div className="surface rounded-xl py-14 px-6 text-center">
          <div className="inline-flex h-12 w-12 rounded-2xl items-center justify-center bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] mb-4">
            <Scissors className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Aún no hay servicios.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Creá el primero y definí precio + duración.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="surface rounded-xl overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-[1fr,140px,120px,90px,60px] gap-4 px-5 py-3 border-b border-[hsl(var(--border))] text-[11px] uppercase tracking-wider text-muted-foreground">
            <div>Servicio</div>
            <div className="text-right">Precio</div>
            <div className="text-right">Duración</div>
            <div className="text-right">Activo</div>
            <div />
          </div>

          <div className="divide-y divide-[hsl(var(--border))]">
            {items.map(s => (
              <div
                key={s.id}
                className={cn(
                  'grid grid-cols-[1fr,auto] md:grid-cols-[1fr,140px,120px,90px,60px] gap-3 md:gap-4 px-4 md:px-5 py-3.5 items-center',
                  'transition-colors hover:bg-[hsl(var(--surface-2))]/40',
                  !s.activo && 'opacity-60'
                )}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.nombre}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 md:hidden flex gap-3 tabular">
                    <span>{formatCLP(s.precio)}</span>
                    <span>·</span>
                    <span>{s.duracion_min} min</span>
                  </div>
                  {s.descripcion && <div className="text-xs text-muted-foreground/80 truncate mt-0.5">{s.descripcion}</div>}
                </div>
                <div className="hidden md:block text-right font-medium tabular">{formatCLP(s.precio)}</div>
                <div className="hidden md:block text-right text-sm text-muted-foreground tabular">{s.duracion_min} min</div>
                <div className="hidden md:flex justify-end">
                  <Switch checked={!!s.activo} onCheckedChange={() => toggleActivo(s)} />
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span className="md:hidden"><Switch checked={!!s.activo} onCheckedChange={() => toggleActivo(s)} /></span>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(s)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ServicioDialog
        open={editing !== null}
        servicio={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); cargar() }}
      />
    </div>
  )
}

function ServicioDialog({ open, servicio, onClose, onSaved }) {
  const [form, setForm] = useState({ nombre: '', precio: '', duracion_min: '', descripcion: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (servicio) {
      setForm({
        nombre: servicio.nombre || '',
        precio: String(servicio.precio || ''),
        duracion_min: String(servicio.duracion_min || ''),
        descripcion: servicio.descripcion || '',
      })
    } else {
      setForm({ nombre: '', precio: '', duracion_min: '30', descripcion: '' })
    }
    setError('')
  }, [servicio, open])

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const body = {
        nombre: form.nombre,
        precio: Number(form.precio),
        duracion_min: Number(form.duracion_min),
        descripcion: form.descripcion || null,
      }
      const url = servicio ? `/api/servicios/${servicio.id}` : '/api/servicios'
      const method = servicio ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Error')
      onSaved()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{servicio ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          <DialogDescription>Precio en CLP, duración en minutos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nombre</Label>
            <Input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Precio</Label>
              <Input required type="number" min="0" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duración (min)</Label>
              <Input required type="number" min="5" max="480" value={form.duracion_min} onChange={e => setForm(f => ({ ...f, duracion_min: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descripción (opcional)</Label>
            <Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          </div>
          {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
