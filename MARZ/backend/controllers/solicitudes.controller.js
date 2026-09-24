/**
 * solicitudes.controller.js — HU02, HU03, HU04
 * Controladores HTTP para solicitudes.
 */

'use strict';

const svc = require('../services/solicitudes.service');

/** GET /api/solicitudes — HU03 */
function listar(req, res) {
  try {
    const solicitudes = svc.listarSolicitudes(req.usuario);
    return res.status(200).json(solicitudes);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/** POST /api/solicitudes — HU02 */
function crear(req, res) {
  const { titulo, descripcion, categoria_id } = req.body;

  if (!titulo || !descripcion || !categoria_id) {
    return res.status(400).json({ error: 'Título, descripción y categoría son obligatorios.' });
  }

  if (titulo.trim().length === 0 || descripcion.trim().length === 0) {
    return res.status(400).json({ error: 'Título y descripción no pueden estar vacíos.' });
  }

  try {
    const solicitud = svc.crearSolicitud(
      { titulo, descripcion, categoriaId: Number(categoria_id) },
      req.usuario.id,
    );
    return res.status(201).json(solicitud);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/** GET /api/solicitudes/:id — HU03 */
function obtener(req, res) {
  try {
    const solicitud = svc.obtenerSolicitud(Number(req.params.id), req.usuario);
    return res.status(200).json(solicitud);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/** PATCH /api/solicitudes/:id/prioridad — HU04 */
function cambiarPrioridad(req, res) {
  const { prioridad } = req.body;

  if (!prioridad) {
    return res.status(400).json({ error: 'El campo prioridad es obligatorio.' });
  }

  try {
    const solicitud = svc.cambiarPrioridad(Number(req.params.id), prioridad, req.usuario);
    return res.status(200).json(solicitud);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/** PATCH /api/solicitudes/:id/estado */
function cambiarEstado(req, res) {
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ error: 'El campo estado es obligatorio.' });
  }

  try {
    const solicitud = svc.cambiarEstado(Number(req.params.id), estado, req.usuario);
    return res.status(200).json(solicitud);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/** PATCH /api/solicitudes/:id/asignar */
function asignar(req, res) {
  const { agente_id } = req.body;

  if (!agente_id) {
    return res.status(400).json({ error: 'El campo agente_id es obligatorio.' });
  }

  try {
    const solicitud = svc.asignarSolicitud(Number(req.params.id), Number(agente_id), req.usuario);
    return res.status(200).json(solicitud);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/** GET /api/solicitudes/agentes — para el coordinador */
function listarAgentes(req, res) {
  try {
    return res.status(200).json(svc.listarAgentes());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/** GET /api/categorias */
function listarCategorias(req, res) {
  try {
    return res.status(200).json(svc.listarCategorias());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, crear, obtener, cambiarPrioridad, cambiarEstado, asignar, listarAgentes, listarCategorias };
