/**
 * auditoria.js — Auditor (solo lectura)
 * Vista del historial completo de cambios. Sin botones de modificación.
 */

import { auditoriaApi } from '../../api.js';
import { formatDate, escapeHtml } from '../dashboard.js';

export async function renderAuditoria(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Historial de auditoría</h1>
        <p>Registro inmutable de todos los cambios relevantes del sistema.</p>
      </div>
    </div>

    <div class="filter-bar">
      <input type="text" id="filtro-solicitud" placeholder="ID de solicitud..." style="max-width:180px;width:auto" />
      <input type="text" id="filtro-campo" placeholder="Campo modificado..." style="max-width:180px;width:auto" />
      <button id="btn-filtrar" class="btn btn-secondary">Filtrar</button>
    </div>

    <div id="auditoria-content">
      <div class="loader"><div class="spinner"></div> Cargando historial...</div>
    </div>
  `;

  let historial = [];

  try {
    historial = await auditoriaApi.listar();
    renderTabla(historial);
  } catch (err) {
    document.getElementById('auditoria-content').innerHTML =
      `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    return;
  }

  document.getElementById('btn-filtrar').addEventListener('click', () => {
    const idSolicitud = document.getElementById('filtro-solicitud').value.trim();
    const campo       = document.getElementById('filtro-campo').value.trim().toLowerCase();

    const filtrado = historial.filter(h => {
      const matchId    = !idSolicitud || String(h.solicitud_id) === idSolicitud;
      const matchCampo = !campo       || h.campo_modificado.toLowerCase().includes(campo);
      return matchId && matchCampo;
    });

    renderTabla(filtrado);
  });
}

function renderTabla(historial) {
  const content = document.getElementById('auditoria-content');

  if (historial.length === 0) {
    content.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3>Sin registros</h3>
          <p>No hay entradas de auditoría que coincidan con los filtros.</p>
        </div>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="card" style="margin-bottom:0.75rem">
      <span class="text-sm text-muted">${historial.length} registro${historial.length !== 1 ? 's' : ''} encontrado${historial.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Solicitud</th>
            <th>Campo</th>
            <th>Anterior</th>
            <th>Nuevo valor</th>
            <th>Usuario</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${historial.map(h => `
            <tr>
              <td class="text-muted text-sm">${h.id}</td>
              <td>
                <span class="text-muted text-sm">#${h.solicitud_id}</span>
                <br/>
                <span class="text-sm">${escapeHtml(h.solicitud_titulo)}</span>
              </td>
              <td>
                <span class="badge badge-media" style="font-size:0.7rem">${escapeHtml(h.campo_modificado)}</span>
              </td>
              <td class="text-muted text-sm">${h.valor_anterior ? escapeHtml(h.valor_anterior) : '<em>—</em>'}</td>
              <td class="text-sm"><strong>${escapeHtml(h.valor_nuevo)}</strong></td>
              <td class="text-sm">${escapeHtml(h.usuario_nombre)}<br/><span class="text-muted text-xs">${escapeHtml(h.usuario_email)}</span></td>
              <td class="text-muted text-sm">${formatDate(h.registrado_en)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
