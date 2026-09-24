/**
 * api.js — Cliente HTTP centralizado
 * Adjunta automáticamente el JWT a todas las peticiones autenticadas.
 */

import { getToken, clearSession } from './auth.js';

const BASE = '/api';

/**
 * Realiza una petición fetch con JSON y JWT automático.
 *
 * @param {string} endpoint - Ruta relativa a /api (ej: '/solicitudes')
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${endpoint}`, { ...options, headers });

  // Sesión expirada — limpiar y recargar al login
  if (res.status === 401) {
    clearSession();
    window.location.hash = '#/login';
    throw new Error('Sesión expirada. Inicia sesión nuevamente.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  login:  (email, password)  => apiFetch('/auth/login',  { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: ()                 => apiFetch('/auth/logout', { method: 'POST' }),
};

// ─── Solicitudes ───────────────────────────────────────────────────
export const solicitudesApi = {
  listar:         ()                       => apiFetch('/solicitudes'),
  crear:          (body)                   => apiFetch('/solicitudes',           { method: 'POST',  body: JSON.stringify(body) }),
  obtener:        (id)                     => apiFetch(`/solicitudes/${id}`),
  cambiarPrioridad: (id, prioridad)        => apiFetch(`/solicitudes/${id}/prioridad`, { method: 'PATCH', body: JSON.stringify({ prioridad }) }),
  cambiarEstado:  (id, estado)             => apiFetch(`/solicitudes/${id}/estado`,    { method: 'PATCH', body: JSON.stringify({ estado }) }),
  asignar:        (id, agente_id)          => apiFetch(`/solicitudes/${id}/asignar`,   { method: 'PATCH', body: JSON.stringify({ agente_id }) }),
};

// ─── Catálogos ─────────────────────────────────────────────────────
export const catalogosApi = {
  categorias: () => apiFetch('/categorias'),
  agentes:    () => apiFetch('/solicitudes/agentes'),
};

// ─── Auditoría ─────────────────────────────────────────────────────
export const auditoriaApi = {
  listar:        (solicitudId = null) => apiFetch(solicitudId ? `/auditoria?solicitud_id=${solicitudId}` : '/auditoria'),
  porSolicitud:  (id)                 => apiFetch(`/auditoria/${id}`),
};
