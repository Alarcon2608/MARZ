/**
 * auth.test.js — HU01
 * Tests de autenticación con Supertest + Jest.
 *
 * Criterios verificados:
 * - Credenciales válidas permiten acceso.
 * - Credenciales inválidas no revelan si el usuario existe.
 * - La sesión puede cerrarse.
 * - Un usuario no puede acceder a funciones de otro rol (401/403).
 */

'use strict';

const request = require('supertest');
const app     = require('../backend/server');
const { getDb } = require('../backend/config/db');
const bcrypt  = require('bcrypt');

let tokenSolicitante;
let tokenAgente;
let tokenCoordinador;
let tokenAuditor;

// ─── Setup: crear usuarios de test en la DB ────────────────────────────────────
beforeAll(async () => {
  const db = getDb();

  // Limpiar usuarios de test anteriores
  db.exec(`DELETE FROM usuarios WHERE email LIKE '%@test.marz'`);

  const hash = await bcrypt.hash('Test1234!', 12);

  const roles = ['solicitante', 'agente', 'coordinador', 'auditor'];
  for (const rol of roles) {
    const rolRow = db.prepare('SELECT id FROM roles WHERE nombre = ?').get(rol);
    db.prepare(`
      INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, rol_id)
      VALUES (?, ?, ?, ?)
    `).run(`Test ${rol}`, `${rol}@test.marz`, hash, rolRow.id);
  }
});

afterAll(() => {
  const db = getDb();
  db.exec(`DELETE FROM usuarios WHERE email LIKE '%@test.marz'`);
});

// ─── HU01: Login ──────────────────────────────────────────────────────────────
describe('HU01 — Login', () => {

  test('Credenciales válidas retornan token y datos del usuario', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'solicitante@test.marz', password: 'Test1234!',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.rol).toBe('solicitante');
    tokenSolicitante = res.body.token;
  });

  test('Credenciales inválidas retornan 401 con mensaje genérico', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'solicitante@test.marz', password: 'wrongpass',
    });
    expect(res.status).toBe(401);
    // Mensaje no debe revelar si el usuario existe
    expect(res.body.error).not.toContain('usuario');
    expect(res.body.error).not.toContain('existe');
  });

  test('Email que no existe retorna el mismo 401 genérico', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.marz', password: 'Test1234!',
    });
    expect(res.status).toBe(401);
  });

  test('Body vacío retorna 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

});

// ─── HU01: Logout ─────────────────────────────────────────────────────────────
describe('HU01 — Logout', () => {

  test('Logout con token válido retorna 200', async () => {
    const { body } = await request(app).post('/api/auth/login').send({
      email: 'agente@test.marz', password: 'Test1234!',
    });
    tokenAgente = body.token;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenAgente}`);
    expect(res.status).toBe(200);
  });

  test('Logout sin token retorna 401', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

});

// ─── HU01: Protección de rutas ────────────────────────────────────────────────
describe('HU01 — Protección de rutas por rol', () => {

  beforeAll(async () => {
    const login = async (email) => {
      const { body } = await request(app).post('/api/auth/login').send({ email, password: 'Test1234!' });
      return body.token;
    };
    tokenSolicitante = await login('solicitante@test.marz');
    tokenAgente      = await login('agente@test.marz');
    tokenCoordinador = await login('coordinador@test.marz');
    tokenAuditor     = await login('auditor@test.marz');
  });

  test('Sin token → 401 en ruta protegida', async () => {
    const res = await request(app).get('/api/solicitudes');
    expect(res.status).toBe(401);
  });

  test('Solicitante NO puede acceder a /api/auditoria (403)', async () => {
    const res = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenSolicitante}`);
    expect(res.status).toBe(403);
  });

  test('Agente NO puede acceder a /api/auditoria (403)', async () => {
    const res = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenAgente}`);
    expect(res.status).toBe(403);
  });

  test('Auditor SÍ puede acceder a /api/auditoria (200)', async () => {
    const res = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenAuditor}`);
    expect(res.status).toBe(200);
  });

  test('Agente NO puede crear solicitudes (403)', async () => {
    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tokenAgente}`)
      .send({ titulo: 'test', descripcion: 'test', categoria_id: 1 });
    expect(res.status).toBe(403);
  });

  test('Solicitante NO puede cambiar prioridad (403)', async () => {
    const res = await request(app)
      .patch('/api/solicitudes/1/prioridad')
      .set('Authorization', `Bearer ${tokenSolicitante}`)
      .send({ prioridad: 'Alta' });
    expect(res.status).toBe(403);
  });

});
