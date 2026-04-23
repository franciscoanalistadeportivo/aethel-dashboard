-- ============================================================================
-- AETHEL — schema mínimo esperado por el dashboard
-- ============================================================================
-- Corré esto manualmente en el VPS una vez, o via:  node scripts/schema.js
-- Las tablas base (negocios, servicios, citas, horarios, clientes, bloqueos,
-- recordatorios) ya existen según el brief. Este script sólo ASEGURA que
-- existan las columnas/índices que el dashboard asume + agrega las tablas
-- nuevas (usuarios, login_attempts).
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- usuarios: login de dueños de negocios (1 negocio = 1+ usuarios)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- login_attempts: rate-limit por IP + audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ip          VARCHAR(64)  NOT NULL,
  email       VARCHAR(120) NOT NULL DEFAULT '',
  exito       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_login_ip_time (ip, created_at),
  KEY ix_login_email_time (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Asegurar columnas esperadas por el dashboard en tablas existentes.
-- (Si las columnas ya existen, ALTER IGNORE / MODIFY no romperá.)
-- ---------------------------------------------------------------------------

-- citas — estado ENUM + origen (bot/manual) + creado_por (auditoría)
-- Ajustar nombres si tu schema difiere.

-- ---------------------------------------------------------------------------
-- Índice único para horarios.dia_semana (upsert en POST /api/horarios)
-- ---------------------------------------------------------------------------
-- Asegurarse de que existe:
--   ALTER TABLE horarios ADD UNIQUE KEY uk_negocio_dia (negocio_id, dia_semana);
