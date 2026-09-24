/**
 * server.js — MAR-Z Express Server
 * Punto de entrada del backend.
 */

'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { PORT, NODE_ENV } = require('./config/env');

// Inicializar DB al arranque
require('./config/db').getDb();

const app = express();

// ─── Middleware global ───────────────────────────────────────────────────────
app.use(cors({
  origin: NODE_ENV === 'production' ? false : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json());

// ─── Rutas API ────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/solicitudes', require('./routes/solicitudes.routes'));
app.use('/api/categorias', (req, res, next) => {
  // Ruta de categorías accesible desde /api/categorias también
  req.url = '/categorias';
  require('./routes/solicitudes.routes')(req, res, next);
});
app.use('/api/auditoria',  require('./routes/auditoria.routes'));

// ─── Frontend estático ────────────────────────────────────────────────────────
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
app.use(express.static(FRONTEND_DIR));

// SPA fallback — cualquier ruta no-API sirve index.html
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ─── Error handler global ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor.' });
});

// ─── Inicio del servidor ──────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[MAR-Z] Servidor corriendo en http://localhost:${PORT}`);
    console.log(`[MAR-Z] Entorno: ${NODE_ENV}`);
  });
}

module.exports = app;
