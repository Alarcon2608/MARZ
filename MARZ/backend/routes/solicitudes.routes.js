/**
 * solicitudes.routes.js — HU02, HU03, HU04
 * Todas las rutas requieren autenticación.
 * Las rutas específicas también requieren el rol correspondiente.
 */

'use strict';

const express   = require('express');
const router    = express.Router();
const ctrl      = require('../controllers/solicitudes.controller');
const authMw    = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// Todas las rutas de este router requieren autenticación
router.use(authMw);

// Catálogo de categorías — cualquier usuario autenticado
router.get('/categorias', ctrl.listarCategorias);

// Lista de agentes — solo coordinador
router.get('/agentes', requireRole('coordinador'), ctrl.listarAgentes);

// HU03 — Listar solicitudes (filtro por rol aplicado en el servicio)
router.get('/', ctrl.listar);

// HU02 — Crear solicitud (solo solicitante)
router.post('/', requireRole('solicitante'), ctrl.crear);

// HU03 — Detalle de una solicitud (control de acceso en el servicio)
router.get('/:id', ctrl.obtener);

// HU04 — Cambiar prioridad (solo coordinador)
router.patch('/:id/prioridad', requireRole('coordinador'), ctrl.cambiarPrioridad);

// Asignar agente (solo coordinador)
router.patch('/:id/asignar', requireRole('coordinador'), ctrl.asignar);

// Cambiar estado (solo agente)
router.patch('/:id/estado', requireRole('agente'), ctrl.cambiarEstado);

module.exports = router;
