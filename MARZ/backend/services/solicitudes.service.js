/**
 * solicitudes.service.js — HU02, HU03, HU04
 * Lógica de negocio para gestión de solicitudes.
 */

'use strict';

const { getDb } = require('../config/db');
const { registrarCambio } = require('./auditoria.service');

const ESTADOS_VALIDOS   = ['Nuevo', 'En Proceso', 'Resuelto', 'Cerrado'];
const PRIORIDADES_VALIDAS = ['Baja', 'Media', 'Alta', 'Critica'];

/**
 * HU02 — Crear una nueva solicitud.
 * Solo solicitantes pueden crear (controlado por middleware, no repetido aquí).
 *
 * @param {object} datos
 * @param {string} datos.titulo
 * @param {string} datos.descripcion
 * @param {number} datos.categoriaId
 * @param {number} solicitanteId - Extraído del JWT, nunca del body.
 * @returns {object} solicitud creada
 */
function crearSolicitud({ titulo, descripcion, categoriaId }, solicitanteId) {
  const db = getDb();

  // Validar que la categoría exista
  const categoria = db.prepare('SELECT id FROM categorias WHERE id = ?').get(categoriaId);
  if (!categoria) {
    const err = new Error('Categoría no válida.');
    err.status = 400;
    throw err;
  }

  const result = db.prepare(`
    INSERT INTO solicitudes (titulo, descripcion, categoria_id, solicitante_id)
    VALUES (?, ?, ?, ?)
  `).run(titulo.trim(), descripcion.trim(), categoriaId, solicitanteId);

  const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(result.lastInsertRowid);

  // Registrar creación en auditoría (HU02 — se registra el propietario)
  registrarCambio({
    solicitudId:   solicitud.id,
    usuarioId:     solicitanteId,
    campo:         'estado',
    valorAnterior: null,
    valorNuevo:    'Nuevo',
  });

  return solicitud;
}

/**
 * HU03 — Listar solicitudes según el rol del usuario.
 * - Solicitante: solo sus propias.
 * - Agente: solo las asignadas a él.
 * - Coordinador: todas.
 *
 * @param {object} usuario - Payload del JWT.
 * @returns {object[]}
 */
function listarSolicitudes(usuario) {
  const db = getDb();

  const base = `
    SELECT
      s.id, s.titulo, s.estado, s.prioridad,
      s.creado_en, s.actualizado_en,
      c.nombre AS categoria,
      u.nombre AS solicitante_nombre,
      a.nombre AS agente_nombre
    FROM solicitudes s
    JOIN categorias c ON c.id = s.categoria_id
    JOIN usuarios   u ON u.id = s.solicitante_id
    LEFT JOIN usuarios a ON a.id = s.agente_id
  `;

  if (usuario.rol === 'solicitante') {
    return db.prepare(base + ' WHERE s.solicitante_id = ? ORDER BY s.creado_en DESC')
      .all(usuario.id);
  }

  if (usuario.rol === 'agente') {
    return db.prepare(base + ' WHERE s.agente_id = ? ORDER BY s.prioridad DESC, s.creado_en DESC')
      .all(usuario.id);
  }

  // coordinador y auditor ven todas
  return db.prepare(base + ' ORDER BY s.creado_en DESC').all();
}

/**
 * HU03 — Obtener detalle de una solicitud.
 * Control de acceso:
 * - Solicitante: solo la suya.
 * - Agente: solo las asignadas.
 * - Coordinador/Auditor: cualquiera.
 *
 * @param {number} id
 * @param {object} usuario
 * @returns {object}
 */
function obtenerSolicitud(id, usuario) {
  const db = getDb();

  const solicitud = db.prepare(`
    SELECT
      s.*,
      c.nombre AS categoria_nombre,
      u.nombre AS solicitante_nombre,
      u.email  AS solicitante_email,
      a.nombre AS agente_nombre,
      a.email  AS agente_email
    FROM solicitudes s
    JOIN categorias c ON c.id = s.categoria_id
    JOIN usuarios   u ON u.id = s.solicitante_id
    LEFT JOIN usuarios a ON a.id = s.agente_id
    WHERE s.id = ?
  `).get(id);

  if (!solicitud) {
    const err = new Error('Solicitud no encontrada.');
    err.status = 404;
    throw err;
  }

  // Control de acceso por rol (HU03)
  if (usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id) {
    const err = new Error('Acceso denegado. Esta solicitud no le pertenece.');
    err.status = 403;
    throw err;
  }

  if (usuario.rol === 'agente' && solicitud.agente_id !== usuario.id) {
    const err = new Error('Acceso denegado. Esta solicitud no le está asignada.');
    err.status = 403;
    throw err;
  }

  return solicitud;
}

/**
 * HU04 — Cambiar la prioridad de una solicitud (solo coordinador).
 * El cambio queda registrado en auditoría.
 *
 * @param {number} id
 * @param {string} prioridad
 * @param {object} usuario - Coordinador autenticado.
 * @returns {object} solicitud actualizada
 */
function cambiarPrioridad(id, prioridad, usuario) {
  const db = getDb();

  if (!PRIORIDADES_VALIDAS.includes(prioridad)) {
    const err = new Error(`Prioridad inválida. Valores permitidos: ${PRIORIDADES_VALIDAS.join(', ')}.`);
    err.status = 400;
    throw err;
  }

  const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(id);
  if (!solicitud) {
    const err = new Error('Solicitud no encontrada.');
    err.status = 404;
    throw err;
  }

  const anteriorPrioridad = solicitud.prioridad;

  db.prepare(`
    UPDATE solicitudes
    SET prioridad = ?, actualizado_en = datetime('now')
    WHERE id = ?
  `).run(prioridad, id);

  // Registrar en auditoría (HU04 — cambio trazable)
  registrarCambio({
    solicitudId:   id,
    usuarioId:     usuario.id,
    campo:         'prioridad',
    valorAnterior: anteriorPrioridad,
    valorNuevo:    prioridad,
  });

  return db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(id);
}

/**
 * Cambiar el estado de una solicitud (agente).
 * El cambio queda registrado en auditoría.
 */
function cambiarEstado(id, estado, usuario) {
  const db = getDb();

  if (!ESTADOS_VALIDOS.includes(estado)) {
    const err = new Error(`Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}.`);
    err.status = 400;
    throw err;
  }

  const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(id);
  if (!solicitud) {
    const err = new Error('Solicitud no encontrada.');
    err.status = 404;
    throw err;
  }

  if (usuario.rol === 'agente' && solicitud.agente_id !== usuario.id) {
    const err = new Error('No puede modificar una solicitud que no tiene asignada.');
    err.status = 403;
    throw err;
  }

  const anteriorEstado = solicitud.estado;

  db.prepare(`
    UPDATE solicitudes
    SET estado = ?, actualizado_en = datetime('now')
    WHERE id = ?
  `).run(estado, id);

  registrarCambio({
    solicitudId:   id,
    usuarioId:     usuario.id,
    campo:         'estado',
    valorAnterior: anteriorEstado,
    valorNuevo:    estado,
  });

  return db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(id);
}

/**
 * Asignar una solicitud a un agente (coordinador).
 */
function asignarSolicitud(id, agenteId, usuario) {
  const db = getDb();

  const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(id);
  if (!solicitud) {
    const err = new Error('Solicitud no encontrada.');
    err.status = 404;
    throw err;
  }

  // Verificar que el agente exista y tenga rol agente
  const agente = db.prepare(`
    SELECT u.id FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.id = ? AND r.nombre = 'agente'
  `).get(agenteId);

  if (!agente) {
    const err = new Error('El usuario indicado no existe o no tiene rol de agente.');
    err.status = 400;
    throw err;
  }

  const anteriorAgente = solicitud.agente_id;

  db.prepare(`
    UPDATE solicitudes
    SET agente_id = ?, estado = CASE WHEN estado = 'Nuevo' THEN 'En Proceso' ELSE estado END,
        actualizado_en = datetime('now')
    WHERE id = ?
  `).run(agenteId, id);

  registrarCambio({
    solicitudId:   id,
    usuarioId:     usuario.id,
    campo:         'agente_id',
    valorAnterior: anteriorAgente ? String(anteriorAgente) : null,
    valorNuevo:    String(agenteId),
  });

  return db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(id);
}

/**
 * Listar agentes disponibles (para el coordinador al asignar).
 */
function listarAgentes() {
  const db = getDb();
  return db.prepare(`
    SELECT u.id, u.nombre, u.email
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE r.nombre = 'agente' AND u.activo = 1
    ORDER BY u.nombre
  `).all();
}

/**
 * Listar categorías (catálogo).
 */
function listarCategorias() {
  return getDb().prepare('SELECT * FROM categorias ORDER BY nombre').all();
}

module.exports = {
  crearSolicitud,
  listarSolicitudes,
  obtenerSolicitud,
  cambiarPrioridad,
  cambiarEstado,
  asignarSolicitud,
  listarAgentes,
  listarCategorias,
  ESTADOS_VALIDOS,
  PRIORIDADES_VALIDAS,
};
