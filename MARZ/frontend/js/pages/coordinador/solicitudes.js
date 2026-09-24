/**
 * solicitudes.js (coordinador) — HU04
 * Lista completa de solicitudes con priorización, asignación y ordenamiento.
 * Criterios HU04: prioridad válida; cambio trazable; lista ordenable; solo coordinador.
 */

import { solicitudesApi, catalogosApi } from '../../api.js';
import { estadoBadge, prioridadBadge, formatDate, escapeHtml } from '../dashboard.js';

let todasLasSolicitudes = [];
let agentes             = [];
let ordenCol            = 'creado_en';
let ordenDir            = 'desc';

export async function renderCoordinadorSolicitudes(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Gestión de Solicitudes</h1>
        <p>Prioriza, asigna y supervisa todas las solicitudes del sistema.</p>
      </div>
    </div>

    <div class="filter-bar">
      <select id="filtro-estado">
        <option value="">Todos los estados</option>
        <option value="Nuevo">Nuevo</option>
        <option value="En Proceso">En Proceso</option>
        <option value="Resuelto">Resuelto</option>
        <option value="Cerrado">Cerrado</option>
      </select>
      <select id="filtro-prioridad">
        <option value="">Todas las prioridades</option>
        <option value="Critica">Crítica</option>
        <option value="Alta">Alta</option>
        <option value="Media">Media</option>
        <option value="Baja">Baja</option>
      </select>
      <input type="text" id="filtro-busqueda" placeholder="Buscar por título..." style="max-width:220px" />
    </div>

    <div id="coord-content">
      <div class="loader"><div class="spinner"></div> Cargando...</div>
    </div>
  `;

  try {
    [todasLasSolicitudes, agentes] = await Promise.all([
      solicitudesApi.listar(),
      catalogosApi.agentes(),
    ]);
    renderTabla(todasLasSolicitudes);
  } catch (err) {
    document.getElementById('coord-content').innerHTML =
      `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    return;
  }

  // Filtros
  ['filtro-estado', 'filtro-prioridad', 'filtro-busqueda'].forEach(id => {
    document.getElementById(id).addEventListener('input', aplicarFiltros);
  });
}

function aplicarFiltros() {
  const estado    = document.getElementById('filtro-estado').value;
  const prioridad = document.getElementById('filtro-prioridad').value;
  const busqueda  = document.getElementById('filtro-busqueda').value.toLowerCase();

  const filtradas = todasLasSolicitudes.filter(s => {
    const matchEstado    = !estado    || s.estado    === estado;
    const matchPrioridad = !prioridad || s.prioridad === prioridad;
    const matchBusqueda  = !busqueda  || s.titulo.toLowerCase().includes(busqueda);
    return matchEstado && matchPrioridad && matchBusqueda;
  });

  renderTabla(filtradas);
}

function renderTabla(solicitudes) {
  const content = document.getElementById('coord-content');

  if (solicitudes.length === 0) {
    content.innerHTML = `<div class="card"><div class="empty-state"><h3>Sin solicitudes</h3><p>No hay solicitudes que coincidan con los filtros.</p></div></div>`;
    return;
  }

  // Ordenar según columna seleccionada — HU04 (lista ordenable)
  const ordenadas = [...solicitudes].sort((a, b) => {
    const av = a[ordenCol] ?? ''; const bv = b[ordenCol] ?? '';
    const cmp = String(av).localeCompare(String(bv));
    return ordenDir === 'asc' ? cmp : -cmp;
  });

  content.innerHTML = `
    <div class="table-wrapper">
      <table id="coord-tabla">
        <thead>
          <tr>
            <th data-col="id">#</th>
            <th data-col="titulo">Título</th>
            <th data-col="estado">Estado</th>
            <th data-col="prioridad">Prioridad</th>
            <th data-col="solicitante_nombre">Solicitante</th>
            <th data-col="agente_nombre">Agente</th>
            <th data-col="creado_en">Creado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${ordenadas.map(s => `
            <tr>
              <td class="text-muted text-sm">#${s.id}</td>
              <td>
                <a href="#/solicitudes/${s.id}" style="color:var(--text-base);font-weight:600">
                  ${escapeHtml(s.titulo)}
                </a>
              </td>
              <td>${estadoBadge(s.estado)}</td>
              <td>
                <div class="flex gap-1 items-center">
                  ${prioridadBadge(s.prioridad)}
                  <select
                    class="sel-prioridad"
                    data-id="${s.id}"
                    data-actual="${s.prioridad}"
                    style="font-size:0.75rem;padding:0.2rem 0.4rem;max-width:90px"
                  >
                    ${['Baja','Media','Alta','Critica'].map(p =>
                      `<option value="${p}" ${s.prioridad===p?'selected':''}>${p==='Critica'?'Crítica':p}</option>`
                    ).join('')}
                  </select>
                </div>
              </td>
              <td class="text-sm">${escapeHtml(s.solicitante_nombre || '—')}</td>
              <td>
                <select
                  class="sel-agente"
                  data-id="${s.id}"
                  style="font-size:0.75rem;padding:0.2rem 0.4rem;max-width:140px"
                >
                  <option value="">Sin asignar</option>
                  ${agentes.map(a =>
                    `<option value="${a.id}" ${s.agente_nombre===a.nombre?'selected':''}>${escapeHtml(a.nombre)}</option>`
                  ).join('')}
                </select>
              </td>
              <td class="text-muted text-sm">${formatDate(s.creado_en)}</td>
              <td>
                <a href="#/solicitudes/${s.id}" class="btn btn-sm btn-secondary">Detalle</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <p class="text-sm text-muted mt-1" style="padding:0 0.5rem">${ordenadas.length} solicitud${ordenadas.length !== 1 ? 'es' : ''}</p>
  `;

  // Ordenamiento por columna — HU04
  document.querySelectorAll('#coord-tabla th[data-col]').forEach(th => {
    if (th.dataset.col === ordenCol) th.classList.add('sorted');
    th.addEventListener('click', () => {
      if (ordenCol === th.dataset.col) {
        ordenDir = ordenDir === 'asc' ? 'desc' : 'asc';
      } else {
        ordenCol = th.dataset.col;
        ordenDir = 'asc';
      }
      aplicarFiltros();
    });
  });

  // Cambio de prioridad inline — HU04 (cambio trazable vía API)
  document.querySelectorAll('.sel-prioridad').forEach(sel => {
    sel.addEventListener('change', async () => {
      const id       = Number(sel.dataset.id);
      const prioridad = sel.value;
      try {
        await solicitudesApi.cambiarPrioridad(id, prioridad);
        // Actualizar el dato local para que el re-render sea consistente
        const idx = todasLasSolicitudes.findIndex(s => s.id === id);
        if (idx >= 0) todasLasSolicitudes[idx].prioridad = prioridad;
        aplicarFiltros();
      } catch (err) {
        alert(err.message);
        sel.value = sel.dataset.actual;
      }
    });
  });

  // Asignación inline
  document.querySelectorAll('.sel-agente').forEach(sel => {
    sel.addEventListener('change', async () => {
      const id      = Number(sel.dataset.id);
      const agenteId = Number(sel.value);
      if (!agenteId) return;
      try {
        await solicitudesApi.asignar(id, agenteId);
        const idx = todasLasSolicitudes.findIndex(s => s.id === id);
        if (idx >= 0) todasLasSolicitudes[idx].agente_nombre = agentes.find(a => a.id === agenteId)?.nombre;
        aplicarFiltros();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}
