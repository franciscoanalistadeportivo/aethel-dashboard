'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Power } from 'lucide-react'

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

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Servicios</h1>
        <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Nuevo</Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {!loading && items.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Aún no hay servicios.</CardContent></Card>
      )}

      <div className="space-y-2">
        {items.map(s => (
          <Card key={s.id} className={!s.activo ? 'opacity-60' : ''}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold truncate">{s.nombre}</span>
                  {!s.activo && <Badge variant="secondary">Inactivo</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">{formatCLP(s.precio)} · {s.duracion_min} min</div>
                {s.descripcion && <div className="text-xs text-muted-foreground mt-1 truncate">{s.descripcion}</div>}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => toggleActivo(s)}><Power className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
        <DialogHeader><DialogTitle>{servicio ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Precio (CLP)</Label>
              <Input required type="number" min="0" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Duración (min)</Label>
              <Input required type="number" min="5" max="480" value={form.duracion_min} onChange={e => setForm(f => ({ ...f, duracion_min: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descripción (opcional)</Label>
            <Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
