#!/usr/bin/env node
// Ejecuta schema.sql contra la BD configurada en .env.local
// Uso:  node scripts/schema.js

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

// Cargar .env.local manualmente (sin next/dotenv)
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
  const sql = fs.readFileSync(path.resolve(process.cwd(), 'scripts/schema.sql'), 'utf8')
  // multipleStatements=true SOLO para este script de schema
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  })
  try {
    const stmts = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'))
    for (const s of stmts) {
      try { await conn.query(s) }
      catch (e) { console.warn(`[SCHEMA] WARN ejecutando: ${s.slice(0, 80)}... → ${e.message}`) }
    }
    console.log('[SCHEMA] OK')
  } finally { await conn.end() }
}

main().catch(e => { console.error(e); process.exit(1) })
