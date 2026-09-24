/**
 * detalle.js — HU03
 * Detalle de una solicitud. El agente puede cambiar estado; el coordinador puede cambiar prioridad.
 */

import { solicitudesApi, auditoriaApi, catalogosApi } from '../../api.js';
import { getUsuario } from '../../../auth.js';
import { estadoBadge, prioridadBadge, formatDate, escapeHtml } from '../dashboard.js';

export async function renderDetalle(container, id) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Solicitud #${id}</h1>
      </div>
      <button onclick="history.back()" class="btn btn-secondary">← Volver</button>
    </div>
    <div id="detalle-content"><div class="loader"><div class="spinner"></div> Cargando...</div></div>
  `;

  const usuario = getUsuario();

  try {
    const [solicitud, historial] = await Promise.all([
      solicitudesApi.obtener(id),
      // El auditor ya tiene su página; aquí solo coordinador y agente pueden ver mini-historial
      usuario.rol !== 'auditor' ? auditoriaApi.listar(id).catch(() => []) : Promise.resolve([]),
    ]);
    renderContenido(container, solicitud, historial, usuario);
  } catch (err) {
    document.getElementById('detalle-content').innerHTML =
      `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
}

function renderContenido(container, s, historial, usuario) {
  const puedeVerHistorial = ['coordinador', 'agente', 'auditor'].includes(usuario.rol);

  document.getElementById('detalle-content').innerHTML = `
    <div class="detail-grid">
      <!-- Columna principal -->
      <div>
        <div class="card" style="margin-bottom:1rem">
          <div class="flex justify-between items-center" style="margin-bottom:1rem">
            <h2 style="font-size:1.1rem;font-weight:700">${escapeHtml(s.titulo)}</h2>
            <div class="flex gap-1">${estadoBadge(s.estado)} ${prioridadBadge(s.prioridad)}</div>
          </div>
          <p style="color:var(--text-muted);line-height:1.7;white-space:pre-wrap">${escapeHtml(s.descripcion)}</p>

          <div class="detail-meta">
            <div class="meta-item">
              <span class="meta-label">Categoría</span>
              <span class="meta-value">${escapeHtml(s.categoria_nombre)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Solicitante</span>
              <span class="meta-value">${escapeHtml(s.solicitante_nombre)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Agente asignado</span>
              <span class="meta-value">${s.agente_nombre ? escapeHtml(s.agente_nombre) : '<span class="text-muted">Sin asignar</span>'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Creado</span>
              <span class="meta-value">${formatDate(s.creado_en)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Última actualización</span>
              <span class="meta-value">${formatDate(s.actualizado_en)}</span>
            </div>
          </div>
        </div>

        <!-- Agente: cambiar estado -->
        ${usuario.rol === 'agente' ? renderCambioEstado(s) : ''}

        <!-- Mini historial (coordinador / agente) -->
        ${puedeVerHistorial && historial.length > 0 ? renderHistorial(historial) : ''}
      </div>

      <!-- Columna lateral: acciones coordinador -->
      ${usuario.rol === 'coordinador' ? renderAccionesCoordinador(s) : ''}
    </div>
  `;

  // Eventos agente
  if (usuario.rol === 'agente') {
    document.getElementById('form-estado')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const estado = document.getElementById('select-estado').value;
      if (!estado) return;
      try {
        await solicitudesApi.cambiarEstado(s.id, estado);
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Eventos coordinador
  if (usuario.rol === 'coordinador') {
    document.getElementById('form-prioridad')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const prioridad = document.getElementById('select-prioridad').value;
      if (!prioridad) return;
      try {
        await solicitudesApi.cambiarPrioridad(s.id, prioridad);
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    });

    // Cargar agentes para el select
    cargarAgentes(s);
  }
}

function renderCambioEstado(s) {
  const estados = ['Nuevo', 'En Proceso', 'Resuelto', 'Cerrado'].filter(e => e !== s.estado);
  return `
    <div class="card">
      <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:1rem;color:var(--text-muted)">CAMBIAR ESTADO</h3>
      <form id="form-estado" class="flex gap-1">
        <select id="select-estado" style="flex:1">
          <option value="">— Selecciona estado —</option>
          ${estados.map(e => `<option value="${e}">${e}</option>`).join('')}
        </select>
        <button type="submit" class="btn btn-primary">Actualizar</button>
      </form>
    </div>
  `;
}

function renderAccionesCoordinador(s) {
  return `
    <div style="display:flex;flex-direction:column;gap:1rem">
      <div class="card">
        <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:1rem;color:var(--text-muted)">CAMBIAR PRIORIDAD</h3>
        <form id="form-prioridad">
          <div class="form-group" style="margin-bottom:0.75rem">
            <select id="select-prioridad">
              ${['Baja','Media','Alta','Critica'].map(p =>
                `<option value="${p}" ${s.prioridad === p ? 'selected' : ''}>${p === 'Critica' ? 'Crítica' : p}</option>`
              ).join('')}
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Actualizar prioridad</button>
        </form>
      </div>

      <div class="card">
        <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:1rem;color:var(--text-muted)">ASIGNAR AGENTE</h3>
        <div id="agentes-container"><div class="loader"><div class="spinner"></div></div></div>
      </div>
    </div>
  `;
}

async function cargarAgentes(s) {
  try {
    const { catalogosApi } = await import('../../api.js');
    const agentes = await catalogosApi.agentes();
    const cont = document.getElementById('agentes-container');
    if (!cont) return;
    cont.innerHTML = `
      <form id="form-asignar">
        <div class="form-group" style="margin-bottom:0.75rem">
          <select id="select-agente">
            <option value="">— Sin asignar —</option>
            ${agentes.map(a => `<option value="${a.id}" ${s.agente_id == a.id ? 'selected' : ''}>${escapeHtml(a.nombre)}</option>`).join('')}
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Asignar</button>
      </form>
    `;
    document.getElementById('form-asignar').addEventListener('submit', async (e) => {
      e.preventDefault();
      const agenteId = document.getElementById('select-agente').value;
      if (!agenteId) return;
      try {
        await solicitudesApi.asignar(s.id, Number(agenteId));
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    });
  } catch { /* silencioso */ }
}

function renderHistorial(historial) {
  return `
    <div class="card">
      <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:1rem;color:var(--text-muted)">HISTORIAL DE CAMBIOS</h3>
      <div class="timeline">
        ${historial.map(h => `
          <div class="timeline-item">
            <div class="timeline-body">
              <div class="timeline-field">${escapeHtml(h.campo_modificado)}</div>
              <div class="timeline-change">
                ${h.valor_anterior ? `<span class="text-muted">${escapeHtml(h.valor_anterior)}</span> →` : ''}
                <strong>${escapeHtml(h.valor_nuevo)}</strong>
              </div>
              <div class="timeline-user">por ${escapeHtml(h.usuario_nombre)}</div>
            </div>
            <span class="timeline-time">${formatDate(h.registrado_en)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
