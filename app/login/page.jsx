'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Scissors, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get('next') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      router.replace(next)
    } catch (err) {
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6 relative overflow-hidden">
      {/* Backdrop ornaments */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[36rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-48 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 grid place-items-center glow-primary">
            <Scissors className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Aethel</h1>
            <p className="text-sm text-muted-foreground mt-1">Panel de gestión</p>
          </div>
        </div>

        {/* Card */}
        <div className="surface rounded-2xl p-6 sm:p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-wider">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Ingresando…' : (<>Ingresar <ArrowRight className="h-4 w-4" /></>)}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Conexión cifrada · Bloqueo tras 10 intentos</span>
        </div>
      </div>
    </main>
  )
}
