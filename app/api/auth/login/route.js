import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword, setSessionCookie } from '@/lib/auth'
import { registrarIntentoLogin, ipBloqueada, getClientIp } from '@/lib/rate-limit'
import { email, password } from '@/lib/validators'

export async function POST(request) {
  const ip = getClientIp(request)
  let emailIn = ''

  try {
    // Rate limit por IP ANTES de tocar BD
    if (await ipBloqueada(ip)) {
      await registrarIntentoLogin({ ip, email: '', exito: false })
      return NextResponse.json(
        { error: 'Demasiados intentos. Probá de nuevo en una hora.' },
        { status: 429 }
      )
    }

    let body
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

    emailIn = email(body.email)
    const pwdIn = password(body.password)

    // Lookup por email — prepared statement
    const user = await queryOne(
      `SELECT id, negocio_id, email, password_hash, nombre, activo
         FROM usuarios WHERE email = ? LIMIT 1`,
      [emailIn]
    )

    const ok = user && user.activo === 1 && (await verifyPassword(pwdIn, user.password_hash))

    // Registrar intento (para logs + rate limit)
    await registrarIntentoLogin({ ip, email: emailIn, exito: ok })

    if (!ok) {
      // Mensaje genérico — no revelar si el email existe
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    await setSessionCookie({
      uid: user.id,
      negocio_id: user.negocio_id,
      nombre: user.nombre,
    })

    return NextResponse.json({ ok: true, nombre: user.nombre })
  } catch (e) {
    // Cualquier error de validación → 400 sin filtrar internals
    await registrarIntentoLogin({ ip, email: emailIn, exito: false }).catch(() => {})
    return NextResponse.json({ error: e.message || 'Error' }, { status: 400 })
  }
}
