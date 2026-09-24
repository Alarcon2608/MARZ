/**
 * auditoria.service.js — HU04 (trazabilidad de cambios)
 * Lógica de negocio para registrar y consultar el historial de auditoría.
 *
 * Regla de integridad:
 * - Solo INSERT. Sin UPDATE ni DELETE sobre historial_auditoria.
 * - El auditor solo accede en modo lectura.
 */

'use strict';

const { getDb } = require('../config/db');

/**
 * Registra un cambio relevante en el historial.
 * Llamado internamente desde otros servicios, nunca directamente por el usuario.
 *
 * @param {object} params
 * @param {number} params.solicitudId
 * @param {number} params.usuarioId
 * @param {string} params.campo
 * @param {string|null} params.valorAnterior
 * @param {string} params.valorNuevo
 */
function registrarCambio({ solicitudId, usuarioId, campo, valorAnterior, valorNuevo }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO historial_auditoria
      (solicitud_id, usuario_id, campo_modificado, valor_anterior, valor_nuevo)
    VALUES (?, ?, ?, ?, ?)
  `).run(solicitudId, usuarioId, campo, valorAnterior ?? null, String(valorNuevo));
}

/**
 * Obtiene el historial de auditoría completo (solo para rol auditor).
 * Permite filtrar opcionalmente por solicitud_id.
 *
 * @param {number|null} solicitudId - Si se provee, filtra por esa solicitud.
 * @returns {object[]}
 */
function getHistorial(solicitudId = null) {
  const db = getDb();

  if (solicitudId) {
    return db.prepare(`
      SELECT
        h.id,
        h.solicitud_id,
        s.titulo AS solicitud_titulo,
        h.campo_modificado,
        h.valor_anterior,
        h.valor_nuevo,
        h.registrado_en,
        u.nombre AS usuario_nombre,
        u.email  AS usuario_email
      FROM historial_auditoria h
      JOIN solicitudes s ON s.id = h.solicitud_id
      JOIN usuarios    u ON u.id = h.usuario_id
      WHERE h.solicitud_id = ?
      ORDER BY h.registrado_en DESC
    `).all(solicitudId);
  }

  return db.prepare(`
    SELECT
      h.id,
      h.solicitud_id,
      s.titulo AS solicitud_titulo,
      h.campo_modificado,
      h.valor_anterior,
      h.valor_nuevo,
      h.registrado_en,
      u.nombre AS usuario_nombre,
      u.email  AS usuario_email
    FROM historial_auditoria h
    JOIN solicitudes s ON s.id = h.solicitud_id
    JOIN usuarios    u ON u.id = h.usuario_id
    ORDER BY h.registrado_en DESC
  `).all();
}

module.exports = { registrarCambio, getHistorial };
