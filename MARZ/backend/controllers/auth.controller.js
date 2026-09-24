/**
 * auth.controller.js — HU01
 * Controladores HTTP para autenticación.
 */

'use strict';

const authService = require('../services/auth.service');

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }

  try {
    const result = await authService.login(email.trim().toLowerCase(), password);
    return res.status(200).json(result);
  } catch (err) {
    // Siempre el mismo código y mensaje para no revelar si el usuario existe (HU01)
    return res.status(401).json({ error: err.message });
  }
}

/**
 * POST /api/auth/logout
 * La sesión se cierra en el cliente eliminando el token.
 * El backend confirma el cierre (stateless JWT).
 */
function logout(req, res) {
  // Con JWT stateless, el logout se delega al cliente.
  // El frontend elimina el token de localStorage.
  return res.status(200).json({ mensaje: 'Sesión cerrada correctamente.' });
}

module.exports = { login, logout };
