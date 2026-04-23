import { query, queryOne } from '@/lib/db'
import { requireSession, ok, badRequest, serverError } from '@/lib/api'
import { int, estadoCita, str, fechaISO, horaHHMM } from '@/lib/validators'

// PATCH /api/citas/[id] — cambiar estado, reprogramar o editar notas
// Importante: valida que la cita pertenezca al negocio de la sesión
export async function PATCH(request, { params }) {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  try {
    const id = int((await params).id, { min: 1 })
    const body = await request.json().catch(() => ({}))

    // Confirmar ownership antes de actualizar
    const actual = await queryOne(
      `SELECT id FROM citas WHERE id = ? AND negocio_id = ?`,
      [id, negocio_id]
    )
    if (!actual) return badRequest('Cita no encontrada')

    const sets = []
    const vals = []

    if (body.estado !== undefined) {
      sets.push('estado = ?')
      vals.push(estadoCita(body.estado))
    }
    if (body.fecha !== undefined) {
      sets.push('fecha = ?')
      vals.push(fechaISO(body.fecha))
    }
    if (body.hora !== undefined) {
      sets.push('hora = ?')
      vals.push(horaHHMM(body.hora))
    }
    if (body.notas !== undefined) {
      sets.push('notas = ?')
      vals.push(body.notas === null ? null : str(body.notas, { max: 500 }))
    }

    if (sets.length === 0) return badRequest('Nada que actualizar')

    sets.push('updated_at = NOW()')
    vals.push(id, negocio_id)

    await query(
      `UPDATE citas SET ${sets.join(', ')} WHERE id = ? AND negocio_id = ?`,
      vals
    )

    const cita = await queryOne(
      `SELECT c.*, s.nombre AS servicio_nombre, s.duracion_min, s.precio
         FROM citas c LEFT JOIN servicios s ON s.id = c.servicio_id
        WHERE c.id = ? AND c.negocio_id = ?`,
      [id, negocio_id]
    )
    return ok({ cita })
  } catch (e) {
    return badRequest(e.message || 'Error actualizando cita')
  }
}
