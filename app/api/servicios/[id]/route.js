import { query, queryOne } from '@/lib/db'
import { requireSession, ok, badRequest } from '@/lib/api'
import { str, int, bool } from '@/lib/validators'

export async function PATCH(request, { params }) {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  try {
    const id = int((await params).id, { min: 1 })
    const body = await request.json().catch(() => ({}))

    const actual = await queryOne(
      `SELECT id FROM servicios WHERE id = ? AND negocio_id = ?`,
      [id, negocio_id]
    )
    if (!actual) return badRequest('Servicio no encontrado')

    const sets = []
    const vals = []
    if (body.nombre !== undefined)        { sets.push('nombre = ?');        vals.push(str(body.nombre, { min: 2, max: 80 })) }
    if (body.precio !== undefined)        { sets.push('precio = ?');        vals.push(int(body.precio, { min: 0, max: 10_000_000 })) }
    if (body.duracion_min !== undefined)  { sets.push('duracion_min = ?');  vals.push(int(body.duracion_min, { min: 5, max: 480 })) }
    if (body.descripcion !== undefined)   { sets.push('descripcion = ?');   vals.push(body.descripcion === null ? null : str(body.descripcion, { max: 300 })) }
    if (body.activo !== undefined)        { sets.push('activo = ?');        vals.push(bool(body.activo) ? 1 : 0) }

    if (sets.length === 0) return badRequest('Nada que actualizar')
    sets.push('updated_at = NOW()')
    vals.push(id, negocio_id)

    await query(`UPDATE servicios SET ${sets.join(', ')} WHERE id = ? AND negocio_id = ?`, vals)
    const servicio = await queryOne(`SELECT * FROM servicios WHERE id = ? AND negocio_id = ?`, [id, negocio_id])
    return ok({ servicio })
  } catch (e) {
    return badRequest(e.message || 'Error actualizando servicio')
  }
}
