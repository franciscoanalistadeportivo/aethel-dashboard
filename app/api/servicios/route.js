import { query, queryOne } from '@/lib/db'
import { requireSession, ok, badRequest } from '@/lib/api'
import { str, int, bool } from '@/lib/validators'

export async function GET(request) {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  const { searchParams } = new URL(request.url)
  const incluirInactivos = searchParams.get('todos') === '1'

  const rows = await query(
    incluirInactivos
      ? `SELECT * FROM servicios WHERE negocio_id = ? ORDER BY nombre ASC`
      : `SELECT * FROM servicios WHERE negocio_id = ? AND activo = 1 ORDER BY nombre ASC`,
    [negocio_id]
  )
  return ok({ servicios: rows })
}

export async function POST(request) {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  try {
    const body = await request.json().catch(() => ({}))
    const nombre = str(body.nombre, { min: 2, max: 80 })
    const precio = int(body.precio, { min: 0, max: 10_000_000 })
    const duracion_min = int(body.duracion_min, { min: 5, max: 480 })
    const descripcion = body.descripcion ? str(body.descripcion, { max: 300 }) : null

    const res = await query(
      `INSERT INTO servicios (negocio_id, nombre, precio, duracion_min, descripcion, activo, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [negocio_id, nombre, precio, duracion_min, descripcion]
    )
    const servicio = await queryOne(
      `SELECT * FROM servicios WHERE id = ? AND negocio_id = ?`,
      [res.insertId, negocio_id]
    )
    return ok({ servicio }, 201)
  } catch (e) {
    return badRequest(e.message || 'Error creando servicio')
  }
}
