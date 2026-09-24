/**
 * auth.routes.js — HU01
 */

'use strict';

const express      = require('express');
const router       = express.Router();
const authCtrl     = require('../controllers/auth.controller');
const authMw       = require('../middleware/auth.middleware');

// POST /api/auth/login — público
router.post('/login', authCtrl.login);

// POST /api/auth/logout — requiere sesión activa
router.post('/logout', authMw, authCtrl.logout);

module.exports = router;
