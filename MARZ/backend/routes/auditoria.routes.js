/**
 * auditoria.routes.js
 * Solo el auditor puede consultar el historial. Solo métodos GET.
 */

'use strict';

const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/auditoria.controller');
const authMw      = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

router.use(authMw);
router.use(requireRole('auditor'));

router.get('/', ctrl.getHistorial);
router.get('/:solicitud_id', ctrl.getHistorialPorSolicitud);

module.exports = router;
