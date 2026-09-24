/**
 * db.js — Conexión a SQLite
 * Inicializa la base de datos y aplica el schema si no existe.
 */

'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH     = path.resolve(__dirname, '../../database/marz.db');
const SCHEMA_PATH = path.resolve(__dirname, '../../database/schema.sql');

let _db = null;

/**
 * Retorna la instancia singleton de la base de datos.
 * Crea y aplica el schema en el primer uso.
 * @returns {import('better-sqlite3').Database}
 */
function getDb() {
  if (_db) return _db;

  const isNew = !fs.existsSync(DB_PATH);

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  if (isNew) {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    _db.exec(schema);
    console.log('[DB] Base de datos inicializada desde schema.sql');
  }

  return _db;
}

module.exports = { getDb };
