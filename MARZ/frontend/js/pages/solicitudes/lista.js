/**
 * lista.js — HU03
 * Lista de solicitudes del solicitante (solo las propias).
 */

import { solicitudesApi } from '../../api.js';
import { estadoBadge, prioridadBadge, formatDate, escapeHtml } from '../dashboard.js';

export async function renderLista(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Mis solicitudes</h1>
        <p>Consulta el estado de tus solicitudes de soporte.</p>
      </div>
      <a href="#/solicitudes/nueva" class="btn btn-primary" id="btn-nueva-sol">+ Nueva solicitud</a>
    </div>

    <div class="filter-bar">
      <select id="filtro-estado">
        <option value="">Todos los estados</option>
        <option value="Nuevo">Nuevo</option>
        <option value="En Proceso">En Proceso</option>
        <option value="Resuelto">Resuelto</option>
        <option value="Cerrado">Cerrado</option>
      </select>
    </div>

    <div id="lista-content">
      <div class="loader"><div class="spinner"></div> Cargando solicitudes...</div>
    </div>
  `;

  let solicitudes = [];

  try {
    solicitudes = await solicitudesApi.listar();
    renderTabla(solicitudes);
  } catch (err) {
    document.getElementById('lista-content').innerHTML =
      `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    return;
  }

  document.getElementById('filtro-estado').addEventListener('change', (e) => {
    const filtradas = e.target.value
      ? solicitudes.filter(s => s.estado === e.target.value)
      : solicitudes;
    renderTabla(filtradas);
  });
}

function renderTabla(solicitudes) {
  const content = document.getElementById('lista-content');

  if (solicitudes.length === 0) {
    content.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <h3>Sin solicitudes</h3>
          <p>Aún no has registrado ninguna solicitud de soporte.</p>
          <a href="#/solicitudes/nueva" class="btn btn-primary mt-2">Crear primera solicitud</a>
        </div>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="table-wrapper">
      <table id="tabla-solicitudes">
        <thead>
          <tr>
            <th data-col="id">#</th>
            <th data-col="titulo">Título</th>
            <th data-col="estado">Estado</th>
            <th data-col="prioridad">Prioridad</th>
            <th data-col="categoria">Categoría</th>
            <th data-col="actualizado_en">Última actualización</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${solicitudes.map(s => `
            <tr>
              <td class="text-muted text-sm">#${s.id}</td>
              <td><strong>${escapeHtml(s.titulo)}</strong></td>
              <td>${estadoBadge(s.estado)}</td>
              <td>${prioridadBadge(s.prioridad)}</td>
              <td class="text-muted text-sm">${escapeHtml(s.categoria)}</td>
              <td class="text-muted text-sm">${formatDate(s.actualizado_en)}</td>
              <td>
                <a href="#/solicitudes/${s.id}" class="btn btn-sm btn-secondary">Ver</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Ordenamiento por columna — HU04 (aplicado también aquí para solicitante)
  document.querySelectorAll('#tabla-solicitudes th[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const sorted = [...solicitudes].sort((a, b) => {
        const av = a[col] ?? ''; const bv = b[col] ?? '';
        return String(av).localeCompare(String(bv));
      });
      renderTabla(sorted);
    });
  });
}
