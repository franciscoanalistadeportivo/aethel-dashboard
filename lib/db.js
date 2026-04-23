import mysql from 'mysql2/promise'

let pool = null

export function getPool() {
  if (pool) return pool
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 15000,
    charset: 'utf8mb4',
    // Hard-disable multi-statement queries as belt-and-suspenders vs injection:
    multipleStatements: false,
  })
  return pool
}

/**
 * Ejecuta una query con prepared statement.
 * SIEMPRE usar esta función — nunca concatenar strings.
 */
export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params)
  return rows
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows[0] || null
}
