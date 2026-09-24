/**
 * auditoria.controller.js
 * Controladores HTTP para historial de auditoría (solo lectura).
 */

'use strict';

const auditoriaService = require('../services/auditoria.service');

/** GET /api/auditoria?solicitud_id=X */
function getHistorial(req, res) {
  const solicitudId = req.query.solicitud_id ? Number(req.query.solicitud_id) : null;
  try {
    const historial = auditoriaService.getHistorial(solicitudId);
    return res.status(200).json(historial);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/** GET /api/auditoria/:solicitud_id */
function getHistorialPorSolicitud(req, res) {
  try {
    const historial = auditoriaService.getHistorial(Number(req.params.solicitud_id));
    return res.status(200).json(historial);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getHistorial, getHistorialPorSolicitud };
