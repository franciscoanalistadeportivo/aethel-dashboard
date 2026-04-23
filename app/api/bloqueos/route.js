import { query, queryOne } from '@/lib/db'
import { requireSession, ok, badRequest } from '@/lib/api'
import { int, fechaISO, horaHHMM, str } from '@/lib/validators'

// GET /api/bloqueos?fecha=YYYY-MM-DD  (día) | ?desde=&hasta= (rango)
export async function GET(request) {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get('fecha')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  let rows
  if (desde && hasta) {
    rows = await query(
      `SELECT * FROM bloqueos WHERE negocio_id = ? AND fecha BETWEEN ? AND ?
        ORDER BY fecha ASC, hora_inicio ASC`,
      [negocio_id, fechaISO(desde), fechaISO(hasta)]
    )
  } else {
    const f = fecha ? fechaISO(fecha) : new Date().toISOString().slice(0, 10)
    rows = await query(
      `SELECT * FROM bloqueos WHERE negocio_id = ? AND fecha = ? ORDER BY hora_inicio ASC`,
      [negocio_id, f]
    )
  }
  return ok({ bloqueos: rows })
}

// POST → crear bloqueo
export async function POST(request) {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  try {
    const body = await request.json().catch(() => ({}))
    const fecha = fechaISO(body.fecha)
    const hora_inicio = horaHHMM(body.hora_inicio)
    const hora_fin = horaHHMM(body.hora_fin)
    if (hora_fin <= hora_inicio) return badRequest('Hora fin debe ser mayor que hora inicio')
    const motivo = body.motivo ? str(body.motivo, { max: 200 }) : null

    const res = await query(
      `INSERT INTO bloqueos (negocio_id, fecha, hora_inicio, hora_fin, motivo, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
      [negocio_id, fecha, hora_inicio, hora_fin, motivo]
    )
    const bloqueo = await queryOne(`SELECT * FROM bloqueos WHERE id = ? AND negocio_id = ?`, [res.insertId, negocio_id])
    return ok({ bloqueo }, 201)
  } catch (e) {
    return badRequest(e.message || 'Error creando bloqueo')
  }
}

// DELETE /api/bloqueos?id=123
export async function DELETE(request) {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  try {
    const { searchParams } = new URL(request.url)
    const id = int(searchParams.get('id'), { min: 1 })
    await query(`DELETE FROM bloqueos WHERE id = ? AND negocio_id = ?`, [id, negocio_id])
    return ok({ ok: true })
  } catch (e) {
    return badRequest(e.message || 'Error borrando bloqueo')
  }
}
