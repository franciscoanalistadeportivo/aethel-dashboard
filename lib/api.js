import { NextResponse } from 'next/server'
import { getSession } from './auth'

/**
 * Helper para handlers de API: devuelve el session payload o cierra con 401.
 * CRÍTICO: negocio_id SIEMPRE sale de la sesión, nunca del body/query.
 */
export async function requireSession() {
  const session = await getSession()
  if (!session || !session.negocio_id) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }
  return { session }
}

export function badRequest(msg) {
  return NextResponse.json({ error: msg }, { status: 400 })
}

export function serverError(msg = 'Error interno') {
  return NextResponse.json({ error: msg }, { status: 500 })
}

export function ok(data, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * CORS: solo mismo dominio. Solo usar si ALGÚN endpoint necesita abrirse —
 * por default los endpoints usan cookies con sameSite=lax, no hace falta.
 */
export function sameOriginOnly(request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && !origin.endsWith(host)) {
    return NextResponse.json({ error: 'CORS' }, { status: 403 })
  }
  return null
}
