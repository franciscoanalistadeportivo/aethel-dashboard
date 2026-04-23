/**
 * Validación + sanitización de inputs.
 * Todo lo que viene del cliente DEBE pasar por acá antes de llegar a la BD.
 */

export function str(v, { min = 0, max = 255, trim = true } = {}) {
  if (v === null || v === undefined) return null
  const s = String(v)
  const out = trim ? s.trim() : s
  if (out.length < min) throw new Error(`Texto muy corto (min ${min})`)
  if (out.length > max) throw new Error(`Texto muy largo (max ${max})`)
  return out
}

export function int(v, { min = null, max = null } = {}) {
  const n = Number.parseInt(v, 10)
  if (!Number.isFinite(n)) throw new Error('Número inválido')
  if (min !== null && n < min) throw new Error(`Número debe ser >= ${min}`)
  if (max !== null && n > max) throw new Error(`Número debe ser <= ${max}`)
  return n
}

export function email(v) {
  const s = str(v, { min: 5, max: 120 }).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new Error('Email inválido')
  return s
}

export function password(v) {
  const s = str(v, { min: 8, max: 72, trim: false })
  return s
}

export function telefono(v) {
  const raw = str(v, { max: 30 })
  const clean = raw.replace(/[^\d+]/g, '')
  if (clean.length < 8) throw new Error('Teléfono muy corto')
  return clean
}

export function fechaISO(v) {
  const s = str(v, { min: 10, max: 10 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Fecha debe ser YYYY-MM-DD')
  const d = new Date(s + 'T00:00:00Z')
  if (Number.isNaN(d.getTime())) throw new Error('Fecha inválida')
  return s
}

export function horaHHMM(v) {
  const s = str(v, { min: 5, max: 5 })
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s)) throw new Error('Hora debe ser HH:MM (24h)')
  return s
}

export function estadoCita(v) {
  const s = str(v, { min: 1, max: 20 })
  const OK = ['confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio']
  if (!OK.includes(s)) throw new Error('Estado de cita inválido')
  return s
}

export function bool(v) {
  if (v === true || v === 1 || v === '1' || v === 'true') return true
  if (v === false || v === 0 || v === '0' || v === 'false') return false
  throw new Error('Boolean inválido')
}
