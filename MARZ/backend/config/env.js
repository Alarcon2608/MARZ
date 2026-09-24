/**
 * env.js — Variables de entorno
 * Carga dotenv y valida variables requeridas.
 */

'use strict';

require('dotenv').config();

const required = ['JWT_SECRET'];

required.forEach(key => {
  if (!process.env[key]) {
    console.error(`[ENV] Variable requerida no definida: ${key}`);
    console.error('[ENV] Copia .env.example a .env y completa los valores.');
    process.exit(1);
  }
});

module.exports = {
  PORT:           parseInt(process.env.PORT, 10) || 3000,
  JWT_SECRET:     process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  NODE_ENV:       process.env.NODE_ENV || 'development',
};
