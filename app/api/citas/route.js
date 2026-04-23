import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { requireSession, ok, badRequest, serverError } from '@/lib/api'
import { str, int, telefono, fechaISO, horaHHMM, estadoCita } from '@/lib/validators'

// GET /api/citas?fecha=YYYY-MM-DD  (default: hoy)
// GET /api/citas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD  (rango)
export async function GET(request) {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    let rows
    if (desde && hasta) {
      rows = await query(
        `SELECT c.*, s.nombre AS servicio_nombre, s.duracion_min, s.precio
           FROM citas c
           LEFT JOIN servicios s ON s.id = c.servicio_id AND s.negocio_id = c.negocio_id
          WHERE c.negocio_id = ? AND c.fecha BETWEEN ? AND ?
          ORDER BY c.fecha ASC, c.hora ASC`,
        [negocio_id, fechaISO(desde), fechaISO(hasta)]
      )
    } else {
      const f = fecha ? fechaISO(fecha) : new Date().toISOString().slice(0, 10)
      rows = await query(
        `SELECT c.*, s.nombre AS servicio_nombre, s.duracion_min, s.precio
           FROM citas c
           LEFT JOIN servicios s ON s.id = c.servicio_id AND s.negocio_id = c.negocio_id
          WHERE c.negocio_id = ? AND c.fecha = ?
          ORDER BY c.hora ASC`,
        [negocio_id, f]
      )
    }
    return ok({ citas: rows })
  } catch (e) {
    return serverError(e.message)
  }
}

// POST /api/citas — crear cita manual
// Verifica disponibilidad antes de insertar (no double booking)
export async function POST(request) {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id, uid } = auth.session

  try {
    const body = await request.json().catch(() => ({}))

    const nombre = str(body.nombre_cliente, { min: 2, max: 80 })
    const tel = telefono(body.telefono)
    const servicio_id = int(body.servicio_id, { min: 1 })
    const fecha = fechaISO(body.fecha)
    const hora = horaHHMM(body.hora)
    const notas = body.notas ? str(body.notas, { max: 500 }) : null

    // Confirmar que el servicio pertenece al MISMO negocio de la sesión
    const servicio = await queryOne(
      `SELECT id, duracion_min, precio FROM servicios WHERE id = ? AND negocio_id = ? AND activo = 1`,
      [servicio_id, negocio_id]
    )
    if (!servicio) return badRequest('Servicio no encontrado o desactivado')

    // Verificar solapamiento: misma fecha, horarios que cruzan [hora, hora+duracion)
    const solapamiento = await queryOne(
      `SELECT c.id FROM citas c
         JOIN servicios s ON s.id = c.servicio_id
        WHERE c.negocio_id = ?
          AND c.fecha = ?
          AND c.estado IN ('confirmada','en_progreso')
          AND (
            (c.hora <= ? AND ADDTIME(c.hora, SEC_TO_TIME(s.duracion_min*60)) > ?)
          )
        LIMIT 1`,
      [negocio_id, fecha, hora, hora]
    )
    if (solapamiento) return badRequest('Ya hay una cita en ese horario')

    // Verificar bloqueos manuales
    const bloqueo = await queryOne(
      `SELECT id FROM bloqueos
        WHERE negocio_id = ? AND fecha = ?
          AND hora_inicio <= ? AND hora_fin > ?
        LIMIT 1`,
      [negocio_id, fecha, hora, hora]
    )
    if (bloqueo) return badRequest('Ese horario está bloqueado')

    const res = await query(
      `INSERT INTO citas
        (negocio_id, servicio_id, nombre_cliente, telefono, fecha, hora, estado, notas, origen, creado_por, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'confirmada', ?, 'manual', ?, NOW())`,
      [negocio_id, servicio_id, nombre, tel, fecha, hora, notas, uid]
    )

    const cita = await queryOne(
      `SELECT c.*, s.nombre AS servicio_nombre, s.duracion_min, s.precio
         FROM citas c LEFT JOIN servicios s ON s.id = c.servicio_id
        WHERE c.id = ? AND c.negocio_id = ?`,
      [res.insertId, negocio_id]
    )
    return ok({ cita }, 201)
  } catch (e) {
    return badRequest(e.message || 'Error creando cita')
  }
}
