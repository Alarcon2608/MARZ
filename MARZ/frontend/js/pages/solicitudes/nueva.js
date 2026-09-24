/**
 * nueva.js — HU02
 * Formulario para crear una nueva solicitud.
 * Criterios: Título, Descripción, Categoría obligatorios; ID y fecha auto-generados; estado=Nuevo; propietario registrado.
 */

import { solicitudesApi, catalogosApi } from '../../api.js';
import { escapeHtml } from '../dashboard.js';

export async function renderNueva(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Nueva solicitud</h1>
        <p>Describe el problema o requerimiento de soporte.</p>
      </div>
      <a href="#/solicitudes" class="btn btn-secondary">← Volver</a>
    </div>

    <div class="card" style="max-width:640px">
      <div id="form-error" class="form-error"></div>
      <div id="form-success" class="alert alert-success" style="display:none"></div>

      <div id="form-container">
        <div class="loader"><div class="spinner"></div> Cargando...</div>
      </div>
    </div>
  `;

  let categorias = [];
  try {
    categorias = await catalogosApi.categorias();
  } catch (err) {
    document.getElementById('form-container').innerHTML =
      `<div class="alert alert-error">Error al cargar categorías: ${escapeHtml(err.message)}</div>`;
    return;
  }

  document.getElementById('form-container').innerHTML = `
    <form id="form-nueva" novalidate>
      <div class="form-group">
        <label for="titulo">Título <span style="color:var(--danger)">*</span></label>
        <input
          type="text"
          id="titulo"
          name="titulo"
          placeholder="Resumen breve del problema"
          maxlength="200"
          required
        />
      </div>

      <div class="form-group">
        <label for="categoria_id">Categoría <span style="color:var(--danger)">*</span></label>
        <select id="categoria_id" name="categoria_id" required>
          <option value="">— Selecciona una categoría —</option>
          ${categorias.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label for="descripcion">Descripción <span style="color:var(--danger)">*</span></label>
        <textarea
          id="descripcion"
          name="descripcion"
          placeholder="Describe con detalle el problema, los pasos para reproducirlo y el impacto."
          required
        ></textarea>
      </div>

      <div class="flex gap-1" style="justify-content:flex-end; margin-top:1rem">
        <a href="#/solicitudes" class="btn btn-secondary">Cancelar</a>
        <button type="submit" id="btn-submit" class="btn btn-primary">Enviar solicitud</button>
      </div>
    </form>
  `;

  const form    = document.getElementById('form-nueva');
  const errDiv  = document.getElementById('form-error');
  const succDiv = document.getElementById('form-success');
  const btn     = document.getElementById('btn-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errDiv.classList.remove('visible');
    succDiv.style.display = 'none';

    const titulo       = document.getElementById('titulo').value.trim();
    const descripcion  = document.getElementById('descripcion').value.trim();
    const categoria_id = document.getElementById('categoria_id').value;

    // Validaciones frontend (HU02 — campos obligatorios)
    if (!titulo) { mostrarError('El título es obligatorio.'); return; }
    if (!categoria_id) { mostrarError('Selecciona una categoría.'); return; }
    if (!descripcion) { mostrarError('La descripción es obligatoria.'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Enviando...';

    try {
      const solicitud = await solicitudesApi.crear({ titulo, descripcion, categoria_id: Number(categoria_id) });
      succDiv.style.display = 'flex';
      succDiv.textContent = `✓ Solicitud #${solicitud.id} registrada correctamente. Estado: Nuevo.`;
      form.reset();

      // Redirigir al detalle tras 1.5s
      setTimeout(() => { window.location.hash = `#/solicitudes/${solicitud.id}`; }, 1500);
    } catch (err) {
      mostrarError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar solicitud';
    }
  });

  function mostrarError(msg) {
    errDiv.textContent = msg;
    errDiv.classList.add('visible');
  }
}
