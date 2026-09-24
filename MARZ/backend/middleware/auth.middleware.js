/**
 * auth.middleware.js — HU01
 * Verifica que la petición incluya un JWT válido.
 * Adjunta el payload decodificado en req.usuario.
 *
 * Criterio HU01: Un usuario no puede acceder a funciones protegidas sin sesión válida.
 */

'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Middleware de autenticación.
 * Rechaza la petición con 401 si el token está ausente o es inválido.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Token requerido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload; // { id, email, rol, nombre }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'No autorizado. Token inválido o expirado.' });
  }
}

module.exports = authMiddleware;
