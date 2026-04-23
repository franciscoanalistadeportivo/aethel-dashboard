'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Phone } from 'lucide-react'

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

  const filtrados = clientes.filter(c => {
    if (!q) return true
    const needle = q.toLowerCase()
    return (c.nombre_cliente || '').toLowerCase().includes(needle)
        || (c.telefono || '').includes(needle)
  })

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold">Clientes</h1>
      <Input placeholder="Buscar por nombre o teléfono..." value={q} onChange={e => setQ(e.target.value)} />

      {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {!loading && filtrados.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Sin clientes.</CardContent></Card>
      )}

      <div className="space-y-2">
        {filtrados.map(c => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{c.nombre_cliente || 'Sin nombre'}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefono}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Última visita: {c.ultima_fecha ? String(c.ultima_fecha).slice(0,10) : '—'}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge>{c.total_citas} visita{c.total_citas !== 1 ? 's' : ''}</Badge>
                {c.no_asistio > 0 && <Badge variant="destructive">{c.no_asistio} no asistió</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
