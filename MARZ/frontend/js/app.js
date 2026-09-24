/**
 * app.js — Router SPA y controlador de shell (HU01)
 * Gestiona la navegación hash-based y el menú según el rol activo.
 */

import { isAuthenticated, getUsuario, clearSession } from './auth.js';
import { authApi } from './api.js';
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderLista } from './pages/solicitudes/lista.js';
import { renderNueva } from './pages/solicitudes/nueva.js';
import { renderDetalle } from './pages/solicitudes/detalle.js';
import { renderCoordinadorSolicitudes } from './pages/coordinador/solicitudes.js';
import { renderAuditoria } from './pages/auditoria.js';

// ─── Íconos SVG inline minimalistas ───────────────────────────────────────────
const ICONS = {
  dashboard: `<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  lista:     `<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>`,
  nueva:     `<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  coord:     `<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18"/></svg>`,
  auditoria: `<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
};

// ─── Menú por rol ─────────────────────────────────────────────────────────────
const NAV_BY_ROL = {
  solicitante: [
    { href: '#/dashboard',        icon: ICONS.dashboard, label: 'Inicio' },
    { href: '#/solicitudes',      icon: ICONS.lista,     label: 'Mis solicitudes' },
    { href: '#/solicitudes/nueva',icon: ICONS.nueva,     label: 'Nueva solicitud' },
  ],
  agente: [
    { href: '#/dashboard',   icon: ICONS.dashboard, label: 'Inicio' },
    { href: '#/solicitudes', icon: ICONS.lista,     label: 'Mis asignaciones' },
  ],
  coordinador: [
    { href: '#/dashboard',                icon: ICONS.dashboard, label: 'Inicio' },
    { href: '#/coordinador/solicitudes',  icon: ICONS.coord,     label: 'Gestionar solicitudes' },
  ],
  auditor: [
    { href: '#/dashboard',  icon: ICONS.dashboard, label: 'Inicio' },
    { href: '#/auditoria',  icon: ICONS.auditoria, label: 'Historial de auditoría' },
  ],
};

// ─── Router ───────────────────────────────────────────────────────────────────
const ROUTES = [
  { pattern: /^\/$|^#\/?$|^#\/login$|^$/, handler: () => goLogin() },
  { pattern: /^#\/dashboard$/,            handler: () => renderPage(renderDashboard) },
  { pattern: /^#\/solicitudes\/nueva$/,   handler: () => checkRole(['solicitante'], () => renderPage(renderNueva)) },
  { pattern: /^#\/solicitudes\/(\d+)$/,   handler: (m) => renderPage((c) => renderDetalle(c, Number(m[1]))) },
  { pattern: /^#\/solicitudes$/,          handler: () => checkRole(['solicitante','agente'], () => renderPage(renderLista)) },
  { pattern: /^#\/coordinador\/solicitudes$/, handler: () => checkRole(['coordinador'], () => renderPage(renderCoordinadorSolicitudes)) },
  { pattern: /^#\/auditoria$/,            handler: () => checkRole(['auditor'], () => renderPage(renderAuditoria)) },
];

function navigate() {
  const hash = window.location.hash || '#/';

  // Si no está autenticado → siempre login
  if (!isAuthenticated()) {
    showAuthContainer();
    renderLogin(document.getElementById('page-container-auth'));
    return;
  }

  // Autenticado → buscar ruta
  for (const route of ROUTES) {
    const match = hash.match(route.pattern);
    if (match) {
      route.handler(match);
      return;
    }
  }

  // 404 — redirigir al dashboard
  window.location.hash = '#/dashboard';
}

function renderPage(fn) {
  showAppShell();
  updateNav();
  const container = document.getElementById('page-container');
  container.innerHTML = '';
  fn(container);
}

function goLogin() {
  if (isAuthenticated()) {
    window.location.hash = '#/dashboard';
    return;
  }
  showAuthContainer();
  renderLogin(document.getElementById('page-container-auth'));
}

function checkRole(roles, fn) {
  const u = getUsuario();
  if (!u || !roles.includes(u.rol)) {
    window.location.hash = '#/dashboard';
    return;
  }
  fn();
}

// ─── Shell ────────────────────────────────────────────────────────────────────
function showAppShell() {
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('auth-container').classList.add('hidden');
}

function showAuthContainer() {
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('auth-container').classList.remove('hidden');
}

function updateNav() {
  const usuario = getUsuario();
  if (!usuario) return;

  const nav  = document.getElementById('sidebar-nav');
  const hash = window.location.hash;
  const items = NAV_BY_ROL[usuario.rol] || [];

  nav.innerHTML = items.map(item => `
    <a href="${item.href}"
       class="nav-link ${hash === item.href ? 'active' : ''}"
       id="nav-${item.href.replace(/[^a-z0-9]/gi,'_')}">
      ${item.icon}
      ${item.label}
    </a>
  `).join('');

  // Info de usuario
  const userInfo = document.getElementById('user-info');
  userInfo.innerHTML = `
    <span class="user-name">${escapeHtml(usuario.nombre)}</span>
    <span class="user-role">${usuario.rol}</span>
  `;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Logout ───────────────────────────────────────────────────────────────────
async function handleLogout() {
  try { await authApi.logout(); } catch { /* ignorar errores de red */ }
  clearSession();
  window.location.hash = '#/login';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.getElementById('btn-logout').addEventListener('click', handleLogout);
window.addEventListener('hashchange', navigate);
navigate(); // Carga inicial
