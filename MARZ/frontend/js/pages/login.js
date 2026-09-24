/**
 * login.js — HU01
 * Página de inicio de sesión.
 * Criterios: Credenciales válidas → acceso; Inválidas → mensaje genérico; Sesión cerrable.
 */

import { authApi } from '../api.js';
import { setSession } from '../auth.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="login-card">
      <div class="brand">
        <div class="brand-logo">M</div>
        <h1>MAR-Z</h1>
      </div>
      <p class="login-subtitle">Plataforma de gestión de soporte interno.<br>Ingresa con tus credenciales institucionales.</p>

      <div id="login-error" class="form-error"></div>

      <form id="login-form" novalidate>
        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input
            type="email"
            id="email"
            name="email"
            autocomplete="email"
            placeholder="usuario@organización.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            type="password"
            id="password"
            name="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" id="btn-login" class="btn btn-primary btn-block btn-lg" style="margin-top:0.5rem">
          Iniciar sesión
        </button>
      </form>

      <p class="text-center mt-2 text-sm text-muted">
        Acceso exclusivo para personal autorizado.
      </p>
    </div>
  `;

  const form     = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  const btnLogin = document.getElementById('btn-login');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.classList.remove('visible');
    errorDiv.textContent = '';

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      mostrarError('Completa todos los campos.');
      return;
    }

    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span class="spinner"></span> Ingresando...';

    try {
      const session = await authApi.login(email, password);
      setSession(session);
      // Redirigir al dashboard tras login exitoso (HU01)
      window.location.hash = '#/dashboard';
    } catch (err) {
      mostrarError(err.message || 'Credenciales inválidas.');
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = 'Iniciar sesión';
    }
  });

  function mostrarError(msg) {
    errorDiv.textContent = msg;
    errorDiv.classList.add('visible');
  }
}
