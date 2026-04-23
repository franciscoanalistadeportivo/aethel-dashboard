import { query, queryOne } from '@/lib/db'
import { requireSession, ok, badRequest } from '@/lib/api'
import { int, horaHHMM, bool } from '@/lib/validators'

// GET → lista de 7 días (0=domingo...6=sábado) con hora apertura/cierre
export async function GET() {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  const rows = await query(
    `SELECT dia_semana, hora_apertura, hora_cierre, activo
       FROM horarios WHERE negocio_id = ? ORDER BY dia_semana ASC`,
    [negocio_id]
  )
  return ok({ horarios: rows })
}

// POST → upsert horario de un día { dia_semana, hora_apertura, hora_cierre, activo }
export async function POST(request) {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  try {
    const body = await request.json().catch(() => ({}))
    const dia = int(body.dia_semana, { min: 0, max: 6 })
    const apertura = horaHHMM(body.hora_apertura)
    const cierre = horaHHMM(body.hora_cierre)
    if (cierre <= apertura) return badRequest('Hora de cierre debe ser mayor que apertura')
    const activo = body.activo === undefined ? 1 : (bool(body.activo) ? 1 : 0)

    await query(
      `INSERT INTO horarios (negocio_id, dia_semana, hora_apertura, hora_cierre, activo)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE hora_apertura = VALUES(hora_apertura),
                                 hora_cierre = VALUES(hora_cierre),
                                 activo = VALUES(activo)`,
      [negocio_id, dia, apertura, cierre, activo]
    )
    const h = await queryOne(
      `SELECT dia_semana, hora_apertura, hora_cierre, activo FROM horarios
        WHERE negocio_id = ? AND dia_semana = ?`,
      [negocio_id, dia]
    )
    return ok({ horario: h })
  } catch (e) {
    return badRequest(e.message || 'Error actualizando horario')
  }
}
