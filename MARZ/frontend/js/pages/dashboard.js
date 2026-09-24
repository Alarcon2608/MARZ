/**
 * dashboard.js — HU01, HU03, HU04
 * Panel principal. Muestra indicadores según el rol del usuario.
 */

import { getUsuario } from '../../auth.js';
import { solicitudesApi } from '../../api.js';

const GREET = {
  solicitante:  'Mis Solicitudes',
  agente:       'Solicitudes Asignadas',
  coordinador:  'Panel de Coordinación',
  auditor:      'Panel de Auditoría',
};

export async function renderDashboard(container) {
  const usuario = getUsuario();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>${GREET[usuario.rol] || 'Dashboard'}</h1>
        <p>Bienvenido/a, <strong>${escapeHtml(usuario.nombre)}</strong> · <span style="color:var(--accent);text-transform:capitalize">${usuario.rol}</span></p>
      </div>
      ${usuario.rol === 'solicitante' ? `<a href="#/solicitudes/nueva" class="btn btn-primary">+ Nueva solicitud</a>` : ''}
      ${usuario.rol === 'coordinador' ? `<a href="#/coordinador/solicitudes" class="btn btn-primary">Ver todas las solicitudes</a>` : ''}
      ${usuario.rol === 'auditor' ? `<a href="#/auditoria" class="btn btn-secondary">Ver historial</a>` : ''}
    </div>

    <div id="dashboard-content">
      <div class="loader"><div class="spinner"></div> Cargando...</div>
    </div>
  `;

  try {
    if (usuario.rol === 'auditor') {
      renderAuditorPanel(document.getElementById('dashboard-content'));
      return;
    }

    const solicitudes = await solicitudesApi.listar();
    renderStats(document.getElementById('dashboard-content'), solicitudes, usuario);
  } catch (err) {
    document.getElementById('dashboard-content').innerHTML =
      `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function renderStats(container, solicitudes, usuario) {
  const total       = solicitudes.length;
  const nuevas      = solicitudes.filter(s => s.estado === 'Nuevo').length;
  const enProceso   = solicitudes.filter(s => s.estado === 'En Proceso').length;
  const resueltas   = solicitudes.filter(s => s.estado === 'Resuelto').length;

  const recientes = solicitudes.slice(0, 5);

  container.innerHTML = `
    <div class="card-grid">
      <div class="stat-card">
        <div class="stat-label">Total</div>
        <div class="stat-value">${total}</div>
        <div class="stat-sub">solicitudes registradas</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Nuevas</div>
        <div class="stat-value" style="color:var(--info)">${nuevas}</div>
        <div class="stat-sub">sin atender</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">En proceso</div>
        <div class="stat-value" style="color:var(--warning)">${enProceso}</div>
        <div class="stat-sub">en atención</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Resueltas</div>
        <div class="stat-value" style="color:var(--success)">${resueltas}</div>
        <div class="stat-sub">completadas</div>
      </div>
    </div>

    <div class="card">
      <div class="flex justify-between items-center" style="margin-bottom:1rem">
        <h2 style="font-size:1rem;font-weight:600">Solicitudes recientes</h2>
        <a href="${usuario.rol === 'coordinador' ? '#/coordinador/solicitudes' : '#/solicitudes'}" class="btn btn-sm btn-secondary">Ver todas</a>
      </div>
      ${recientes.length === 0 ? '<div class="empty-state"><p>No hay solicitudes aún.</p></div>' : `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Categoría</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              ${recientes.map(s => `
                <tr onclick="window.location.hash='#/solicitudes/${s.id}'" style="cursor:pointer">
                  <td class="text-muted">#${s.id}</td>
                  <td><strong>${escapeHtml(s.titulo)}</strong></td>
                  <td>${estadoBadge(s.estado)}</td>
                  <td>${prioridadBadge(s.prioridad)}</td>
                  <td class="text-muted text-sm">${escapeHtml(s.categoria)}</td>
                  <td class="text-muted text-sm">${formatDate(s.actualizado_en)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

function renderAuditorPanel(container) {
  container.innerHTML = `
    <div class="card">
      <div class="empty-state">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h3>Panel de Auditoría</h3>
        <p>Accede al historial completo de cambios del sistema.</p>
        <a href="#/auditoria" class="btn btn-primary mt-2">Ver historial de auditoría</a>
      </div>
    </div>
  `;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
export function estadoBadge(estado) {
  const clases = {
    'Nuevo':      'badge-nuevo',
    'En Proceso': 'badge-en-proceso',
    'Resuelto':   'badge-resuelto',
    'Cerrado':    'badge-cerrado',
  };
  return `<span class="badge ${clases[estado] || ''}">${estado}</span>`;
}

export function prioridadBadge(prioridad) {
  const clases = {
    'Baja':    'badge-baja',
    'Media':   'badge-media',
    'Alta':    'badge-alta',
    'Critica': 'badge-critica',
  };
  return `<span class="badge ${clases[prioridad] || ''}">${prioridad === 'Critica' ? 'Crítica' : prioridad}</span>`;
}

export function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str.replace(' ', 'T') + 'Z');
  return d.toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
}

export function escapeHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
