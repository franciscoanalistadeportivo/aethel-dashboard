import { query, queryOne } from './db'

const MAX = Number(process.env.LOGIN_MAX_ATTEMPTS_PER_HOUR || 10)
const WINDOW_MIN = 60

/**
 * Rate-limit backed by MySQL — funciona tanto en VPS como en Vercel serverless.
 * Registra cada intento (éxito/fallo) y bloquea si en la última hora supera MAX.
 */
export async function registrarIntentoLogin({ ip, email, exito }) {
  await query(
    `INSERT INTO login_attempts (ip, email, exito, created_at) VALUES (?, ?, ?, NOW())`,
    [ip || 'unknown', email || '', exito ? 1 : 0]
  )
}

/**
 * Retorna true si esta IP ya superó MAX intentos FALLIDOS en la última hora.
 * Los intentos exitosos NO cuentan para el bloqueo.
 */
export async function ipBloqueada(ip) {
  if (!ip) return false
  const row = await queryOne(
    `SELECT COUNT(*) AS c FROM login_attempts
      WHERE ip = ? AND exito = 0 AND created_at > (NOW() - INTERVAL ? MINUTE)`,
    [ip, WINDOW_MIN]
  )
  return (row?.c || 0) >= MAX
}

/**
 * Extrae la IP del request — considera X-Forwarded-For (proxies/Vercel) y x-real-ip.
 * Tomamos solo el primer hop para evitar spoofing multivalor.
 */
export function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}
