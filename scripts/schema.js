#!/usr/bin/env node
// Auto-migration defensiva: crea tablas `usuarios` y `login_attempts` si faltan
// y agrega columnas/índices que el dashboard asume sobre las tablas existentes
// (servicios, citas, horarios, bloqueos) sin pisar nada.
//
// Uso:  node scripts/schema.js

const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

function loadEnv() {
  const p = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) return
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)
  for (const l of lines) {
    const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+)\s*$/)
    if (m) process.env[m[1]] = m[2]
  }
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  )
  return rows.length > 0
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  )
  return rows.length > 0
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName]
  )
  return rows.length > 0
}

async function ensureColumn(conn, table, column, definition) {
  if (!(await tableExists(conn, table))) {
    console.warn(`[SCHEMA] ⚠ tabla '${table}' no existe — saltando columna ${column}`)
    return
  }
  if (await columnExists(conn, table, column)) return
  const sql = `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`
  await conn.query(sql)
  console.log(`[SCHEMA] + ${table}.${column}`)
}

async function ensureUniqueIndex(conn, table, indexName, columns) {
  if (!(await tableExists(conn, table))) return
  if (await indexExists(conn, table, indexName)) return
  const cols = columns.map(c => `\`${c}\``).join(', ')
  await conn.query(`ALTER TABLE \`${table}\` ADD UNIQUE KEY \`${indexName}\` (${cols})`)
  console.log(`[SCHEMA] + UNIQUE KEY ${table}.${indexName}(${columns.join(', ')})`)
}

async function ensureCreateTable(conn, table, createSql) {
  if (await tableExists(conn, table)) return
  await conn.query(createSql)
  console.log(`[SCHEMA] + CREATE TABLE ${table}`)
}

async function main() {
  loadEnv()
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  })

  try {
    // ── Tablas propias del dashboard (crear si no existen) ───────────────
    await ensureCreateTable(conn, 'usuarios', `
      CREATE TABLE usuarios (
        id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
        negocio_id      INT UNSIGNED NOT NULL,
        email           VARCHAR(120) NOT NULL,
        password_hash   VARCHAR(120) NOT NULL,
        nombre          VARCHAR(80)  NOT NULL,
        activo          TINYINT(1)   NOT NULL DEFAULT 1,
        created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_usuarios_email (email),
        KEY ix_usuarios_negocio (negocio_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)

    await ensureCreateTable(conn, 'login_attempts', `
      CREATE TABLE login_attempts (
        id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        ip          VARCHAR(64)  NOT NULL,
        email       VARCHAR(120) NOT NULL DEFAULT '',
        exito       TINYINT(1)   NOT NULL DEFAULT 0,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY ix_login_ip_time (ip, created_at),
        KEY ix_login_email_time (email, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)

    // ── Migration defensiva sobre tablas pre-existentes del user ────────
    // servicios
    await ensureColumn(conn, 'servicios', 'descripcion', 'VARCHAR(300) NULL')
    await ensureColumn(conn, 'servicios', 'activo', 'TINYINT(1) NOT NULL DEFAULT 1')
    await ensureColumn(conn, 'servicios', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP')
    await ensureColumn(conn, 'servicios', 'updated_at', 'DATETIME NULL ON UPDATE CURRENT_TIMESTAMP')

    // citas
    await ensureColumn(conn, 'citas', 'estado', "VARCHAR(20) NOT NULL DEFAULT 'confirmada'")
    await ensureColumn(conn, 'citas', 'notas', 'VARCHAR(500) NULL')
    await ensureColumn(conn, 'citas', 'origen', "VARCHAR(20) NOT NULL DEFAULT 'manual'")
    await ensureColumn(conn, 'citas', 'creado_por', 'INT UNSIGNED NULL')
    await ensureColumn(conn, 'citas', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP')
    await ensureColumn(conn, 'citas', 'updated_at', 'DATETIME NULL ON UPDATE CURRENT_TIMESTAMP')

    // horarios
    await ensureColumn(conn, 'horarios', 'activo', 'TINYINT(1) NOT NULL DEFAULT 1')
    await ensureUniqueIndex(conn, 'horarios', 'uk_negocio_dia', ['negocio_id', 'dia_semana'])

    // bloqueos
    await ensureColumn(conn, 'bloqueos', 'motivo', 'VARCHAR(200) NULL')
    await ensureColumn(conn, 'bloqueos', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP')

    console.log('[SCHEMA] ✅ OK')
  } catch (e) {
    console.error(`[SCHEMA] ❌ ${e.message}`)
    process.exit(1)
  } finally {
    await conn.end()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
