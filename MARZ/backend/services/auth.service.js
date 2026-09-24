/**
 * auth.service.js — HU01
 * Lógica de negocio para autenticación.
 *
 * Criterios implementados:
 * - Credenciales válidas permiten acceso.
 * - Credenciales inválidas NO revelan si el usuario existe (mensaje genérico).
 */

'use strict';

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { getDb } = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const MSG_INVALIDO = 'Credenciales inválidas.';

/**
 * Autentica un usuario con email y password.
 * Retorna un JWT si las credenciales son válidas.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, usuario: object }}
 * @throws {Error} con mensaje genérico si las credenciales son inválidas.
 */
async function login(email, password) {
  const db = getDb();

  // Busca el usuario junto con su rol
  const usuario = db.prepare(`
    SELECT u.id, u.nombre, u.email, u.password_hash, u.activo, r.nombre AS rol
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.email = ?
  `).get(email);

  // Mensaje genérico para no revelar si el usuario existe (HU01)
  if (!usuario || !usuario.activo) {
    throw new Error(MSG_INVALIDO);
  }

  const passwordOk = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordOk) {
    throw new Error(MSG_INVALIDO);
  }

  const payload = {
    id:     usuario.id,
    email:  usuario.email,
    nombre: usuario.nombre,
    rol:    usuario.rol,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  };
}

module.exports = { login };
