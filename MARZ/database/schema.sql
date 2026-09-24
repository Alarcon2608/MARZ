-- MAR-Z Database Schema
-- Motor: SQLite 3
-- Ejecutado automáticamente por db.js si la base de datos no existe.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────
-- TABLA: roles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT    NOT NULL UNIQUE
    CHECK (nombre IN ('solicitante', 'agente', 'coordinador', 'auditor'))
);

-- ─────────────────────────────────────────────
-- TABLA: usuarios
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  rol_id        INTEGER NOT NULL REFERENCES roles(id),
  activo        INTEGER NOT NULL DEFAULT 1
    CHECK (activo IN (0, 1)),
  creado_en     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- TABLA: categorias
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT    NOT NULL UNIQUE
);

-- ─────────────────────────────────────────────
-- TABLA: solicitudes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS solicitudes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo         TEXT    NOT NULL,
  descripcion    TEXT    NOT NULL,
  categoria_id   INTEGER NOT NULL REFERENCES categorias(id),
  estado         TEXT    NOT NULL DEFAULT 'Nuevo'
    CHECK (estado IN ('Nuevo', 'En Proceso', 'Resuelto', 'Cerrado')),
  prioridad      TEXT    NOT NULL DEFAULT 'Media'
    CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Critica')),
  solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
  agente_id      INTEGER          REFERENCES usuarios(id),
  creado_en      TEXT    NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- TABLA: historial_auditoria
-- REGLA: Solo INSERT desde el backend. Sin UPDATE ni DELETE.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historial_auditoria (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitud_id     INTEGER NOT NULL REFERENCES solicitudes(id),
  usuario_id       INTEGER NOT NULL REFERENCES usuarios(id),
  campo_modificado TEXT    NOT NULL,
  valor_anterior   TEXT,
  valor_nuevo      TEXT    NOT NULL,
  registrado_en    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- DATOS INICIALES: roles y categorias
-- (los usuarios se insertan vía seed.js con hash bcrypt)
-- ─────────────────────────────────────────────
INSERT OR IGNORE INTO roles (nombre) VALUES
  ('solicitante'),
  ('agente'),
  ('coordinador'),
  ('auditor');

INSERT OR IGNORE INTO categorias (nombre) VALUES
  ('Infraestructura'),
  ('Software'),
  ('Hardware'),
  ('Redes'),
  ('Accesos y Seguridad'),
  ('Otro');
