/**
 * role.middleware.js — HU01
 * Fábrica de middleware de autorización basada en roles.
 *
 * Criterio HU01: Un usuario no puede acceder a funciones de otro rol.
 * Criterio HU04: Solo el coordinador puede modificar la prioridad.
 */

'use strict';

/**
 * Genera un middleware que permite el acceso solo a los roles indicados.
 * Debe usarse después de authMiddleware.
 *
 * @param {...string} rolesPermitidos - Roles que pueden acceder a la ruta.
 * @returns {import('express').RequestHandler}
 */
function requireRole(...rolesPermitidos) {
  return function roleMiddleware(req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Esta acción requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = requireRole;
