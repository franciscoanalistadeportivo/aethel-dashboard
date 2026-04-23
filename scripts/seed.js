#!/usr/bin/env node
// Crea usuario demo mariela@demo.cl (negocio_id=1) con bcrypt.
// Uso:  node scripts/seed.js

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

function loadEnv() {
  const p = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) return
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)
  for (const l of lines) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+)\s*$/)
    if (m) process.env[m[1]] = m[2]
  }
}

async function main() {
  loadEnv()
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
  try {
    const email = 'mariela@demo.cl'
    const plain = 'Demo2026$'
    const nombre = 'Peluquería Mariela'
    const negocio_id = 1

    const hash = await bcrypt.hash(plain, 12)

    await conn.execute(
      `INSERT INTO usuarios (negocio_id, email, password_hash, nombre, activo)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash),
                                 nombre = VALUES(nombre),
                                 activo = 1`,
      [negocio_id, email, hash, nombre]
    )
    console.log(`[SEED] ✅ Usuario demo listo: ${email} / Demo2026$  (negocio_id=${negocio_id})`)
  } finally { await conn.end() }
}

main().catch(e => { console.error(e); process.exit(1) })
