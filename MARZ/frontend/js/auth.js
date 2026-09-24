/**
 * auth.js — Gestión de sesión en el cliente (HU01)
 * Almacena y lee el JWT de localStorage.
 * NO almacena contraseñas.
 */

const STORAGE_KEY = 'marz_session';

/**
 * Guarda la sesión tras un login exitoso.
 * @param {{ token: string, usuario: object }} session
 */
export function setSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/**
 * Lee la sesión actual del almacenamiento local.
 * @returns {{ token: string, usuario: object } | null}
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Elimina la sesión local (logout en el cliente). — HU01
 */
export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Retorna el usuario autenticado o null.
 * @returns {object | null}
 */
export function getUsuario() {
  return getSession()?.usuario ?? null;
}

/**
 * Retorna el JWT o null.
 * @returns {string | null}
 */
export function getToken() {
  return getSession()?.token ?? null;
}

/**
 * Verifica si hay una sesión activa.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Verifica si el usuario tiene uno de los roles indicados.
 * @param {...string} roles
 * @returns {boolean}
 */
export function hasRole(...roles) {
  const usuario = getUsuario();
  return usuario ? roles.includes(usuario.rol) : false;
}
