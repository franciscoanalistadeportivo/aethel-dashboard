'use client'

import { useState, useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Phone, Search, Users } from 'lucide-react'
import { InitialAvatar } from '@/components/ui/avatar'

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clientes', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setClientes(d.clientes || []))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = useMemo(() => clientes.filter(c => {
    if (!q) return true
    const needle = q.toLowerCase()
    return (c.nombre_cliente || '').toLowerCase().includes(needle)
        || (c.telefono || '').includes(needle)
  }), [clientes, q])

  const totalVisitas = clientes.reduce((s, c) => s + Number(c.total_citas || 0), 0)

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Base</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} · {totalVisitas} visita{totalVisitas !== 1 ? 's' : ''} histórica{totalVisitas !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por nombre o teléfono…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {!loading && filtrados.length === 0 && (
        <div className="surface rounded-xl py-14 px-6 text-center">
          <div className="inline-flex h-12 w-12 rounded-2xl items-center justify-center bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {clientes.length === 0 ? 'Sin clientes todavía.' : 'Sin resultados para tu búsqueda.'}
          </p>
        </div>
      )}

      {filtrados.length > 0 && (
        <div className="surface rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr,180px,100px,100px] gap-4 px-5 py-3 border-b border-[hsl(var(--border))] text-[11px] uppercase tracking-wider text-muted-foreground">
            <div>Cliente</div>
            <div>Teléfono</div>
            <div className="text-right">Visitas</div>
            <div className="text-right">Última</div>
          </div>

          <div className="divide-y divide-[hsl(var(--border))]">
            {filtrados.map(c => (
              <div
                key={c.id}
                className="grid grid-cols-[auto,1fr,auto] md:grid-cols-[1fr,180px,100px,100px] gap-3 md:gap-4 px-4 md:px-5 py-3.5 items-center transition-colors hover:bg-[hsl(var(--surface-2))]/40"
              >
                <div className="flex items-center gap-3 min-w-0 md:col-span-1 col-span-2">
                  <InitialAvatar name={c.nombre_cliente || '?'} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.nombre_cliente || 'Sin nombre'}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 md:hidden">
                      <Phone className="h-3 w-3" />
                      <span className="truncate tabular">{c.telefono}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground tabular">
                  <Phone className="h-3.5 w-3.5" />
                  {c.telefono}
                </div>
                <div className="flex md:justify-end items-center gap-2">
                  <Badge variant={Number(c.total_citas) >= 5 ? 'default' : 'muted'}>
                    {c.total_citas}
                  </Badge>
                  {Number(c.no_asistio) > 0 && (
                    <Badge variant="destructive">{c.no_asistio} no</Badge>
                  )}
                </div>
                <div className="hidden md:block text-right text-xs text-muted-foreground tabular">
                  {c.ultima_fecha ? String(c.ultima_fecha).slice(0, 10) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
