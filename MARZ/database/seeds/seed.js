/**
 * seed.js — MAR-Z
 * Inserta usuarios de prueba con contraseñas hasheadas (bcrypt).
 * Ejecutar: npm run seed
 *
 * HU: Configuración inicial (FASE 1 Sprint 1)
 * NOTA: Solo para desarrollo. Las contraseñas NO se almacenan en texto plano.
 */

'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const { getDb } = require('../../backend/config/db');

const SALT_ROUNDS = 12;

const seedUsers = [
  { nombre: 'Ana Torres',      email: 'solicitante@marz.local', password: 'Test1234!', rol: 'solicitante' },
  { nombre: 'Luis Medina',     email: 'agente@marz.local',      password: 'Test1234!', rol: 'agente'      },
  { nombre: 'Maria Rios',      email: 'coordinador@marz.local', password: 'Test1234!', rol: 'coordinador' },
  { nombre: 'Carlos Vega',     email: 'auditor@marz.local',     password: 'Test1234!', rol: 'auditor'     },
];

async function main() {
  const db = getDb();

  console.log('[SEED] Iniciando carga de datos de prueba...');

  const getRolId = db.prepare('SELECT id FROM roles WHERE nombre = ?');

  const insertUsuario = db.prepare(`
    INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, rol_id)
    VALUES (?, ?, ?, ?)
  `);

  for (const u of seedUsers) {
    const rol = getRolId.get(u.rol);
    if (!rol) {
      console.error(`[SEED] Rol "${u.rol}" no encontrado. Ejecuta el schema primero.`);
      process.exit(1);
    }

    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    const result = insertUsuario.run(u.nombre, u.email, hash, rol.id);

    if (result.changes > 0) {
      console.log(`[SEED]  Creado: ${u.email} (${u.rol})`);
    } else {
      console.log(`[SEED]  Ya existe: ${u.email} — omitido.`);
    }
  }

  console.log('[SEED] Completado.');
}

main().catch(err => {
  console.error('[SEED] Error:', err.message);
  process.exit(1);
});
