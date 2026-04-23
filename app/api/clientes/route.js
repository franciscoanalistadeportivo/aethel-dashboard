import { query } from '@/lib/db'
import { requireSession, ok } from '@/lib/api'

// GET → lista de clientes con # de visitas + fecha última cita
// Derivado de la tabla de citas del mismo negocio (agrupa por teléfono).
export async function GET() {
  const auth = await requireSession()
  if (auth.error) return auth.error
  const { negocio_id } = auth.session

  const rows = await query(
    `SELECT
        MIN(c.id) AS id,
        c.telefono,
        MAX(c.nombre_cliente) AS nombre_cliente,
        COUNT(*) AS total_citas,
        SUM(CASE WHEN c.estado = 'completada' THEN 1 ELSE 0 END) AS completadas,
        SUM(CASE WHEN c.estado = 'no_asistio' THEN 1 ELSE 0 END) AS no_asistio,
        MAX(c.fecha) AS ultima_fecha
     FROM citas c
     WHERE c.negocio_id = ? AND c.telefono IS NOT NULL AND c.telefono <> ''
     GROUP BY c.telefono
     ORDER BY ultima_fecha DESC
     LIMIT 500`,
    [negocio_id]
  )
  return ok({ clientes: rows })
}
