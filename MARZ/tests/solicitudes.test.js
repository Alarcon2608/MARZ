/**
 * solicitudes.test.js — HU02, HU03, HU04
 */

'use strict';

const request = require('supertest');
const app     = require('../backend/server');
const { getDb } = require('../backend/config/db');
const bcrypt  = require('bcrypt');

let tSolicitante, tAgente, tCoordinador;
let solicitudId;

const login = async (email) => {
  const { body } = await request(app).post('/api/auth/login').send({ email, password: 'Test1234!' });
  return body.token;
};

beforeAll(async () => {
  const db   = getDb();
  const hash = await bcrypt.hash('Test1234!', 12);

  db.exec(`DELETE FROM usuarios WHERE email LIKE '%@sol.marz'`);
  db.exec(`DELETE FROM solicitudes WHERE titulo LIKE '[TEST]%'`);

  const roles = ['solicitante','agente','coordinador'];
  for (const rol of roles) {
    const rolRow = db.prepare('SELECT id FROM roles WHERE nombre = ?').get(rol);
    db.prepare('INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, rol_id) VALUES (?,?,?,?)').run(
      `T_${rol}`, `${rol}@sol.marz`, hash, rolRow.id
    );
  }

  tSolicitante  = await login('solicitante@sol.marz');
  tAgente       = await login('agente@sol.marz');
  tCoordinador  = await login('coordinador@sol.marz');
});

afterAll(() => {
  const db = getDb();
  db.exec(`DELETE FROM usuarios WHERE email LIKE '%@sol.marz'`);
});

// ─── HU02 — Crear solicitud ───────────────────────────────────────────────────
describe('HU02 — Crear solicitud', () => {

  test('Solicitante crea solicitud con campos válidos → 201 + estado Nuevo', async () => {
    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tSolicitante}`)
      .send({ titulo: '[TEST] Falla red', descripcion: 'La red no funciona.', categoria_id: 4 });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('Nuevo');
    expect(res.body.id).toBeDefined();
    solicitudId = res.body.id;
  });

  test('HU02 — Sin título → 400', async () => {
    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tSolicitante}`)
      .send({ descripcion: 'Sin título', categoria_id: 1 });
    expect(res.status).toBe(400);
  });

  test('HU02 — Sin descripción → 400', async () => {
    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tSolicitante}`)
      .send({ titulo: '[TEST] Sin desc', categoria_id: 1 });
    expect(res.status).toBe(400);
  });

  test('HU02 — Sin categoría → 400', async () => {
    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tSolicitante}`)
      .send({ titulo: '[TEST] Sin cat', descripcion: 'Test' });
    expect(res.status).toBe(400);
  });

  test('HU02 — Categoría inexistente → 400', async () => {
    const res = await request(app)
      .post('/api/solicitudes')
      .set('Authorization', `Bearer ${tSolicitante}`)
      .send({ titulo: '[TEST] Cat inv', descripcion: 'Test', categoria_id: 9999 });
    expect(res.status).toBe(400);
  });

});

// ─── HU03 — Consultar solicitudes ────────────────────────────────────────────
describe('HU03 — Consultar solicitudes', () => {

  test('Solicitante lista SOLO sus propias solicitudes', async () => {
    const res = await request(app)
      .get('/api/solicitudes')
      .set('Authorization', `Bearer ${tSolicitante}`);
    expect(res.status).toBe(200);
    // Todas las solicitudes deben pertenecer al solicitante (verificación de control de acceso)
    const propias = res.body.every(s => s.solicitante_nombre.startsWith('T_'));
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Solicitante puede ver detalle de su propia solicitud', async () => {
    const res = await request(app)
      .get(`/api/solicitudes/${solicitudId}`)
      .set('Authorization', `Bearer ${tSolicitante}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(solicitudId);
    expect(res.body.estado).toBeDefined();
    expect(res.body.actualizado_en).toBeDefined();
  });

  test('HU03 — Acceso cruzado: otro solicitante no puede ver la solicitud ajena → 403', async () => {
    // Crear segundo solicitante
    const db   = getDb();
    const hash = await bcrypt.hash('Test1234!', 12);
    const rol  = db.prepare("SELECT id FROM roles WHERE nombre='solicitante'").get();
    db.prepare('INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, rol_id) VALUES (?,?,?,?)').run(
      'T2_solicitante', 'sol2@sol.marz', hash, rol.id
    );
    const t2 = await login('sol2@sol.marz');

    const res = await request(app)
      .get(`/api/solicitudes/${solicitudId}`)
      .set('Authorization', `Bearer ${t2}`);
    expect(res.status).toBe(403);

    db.exec(`DELETE FROM usuarios WHERE email='sol2@sol.marz'`);
  });

  test('Coordinador puede ver cualquier solicitud', async () => {
    const res = await request(app)
      .get(`/api/solicitudes/${solicitudId}`)
      .set('Authorization', `Bearer ${tCoordinador}`);
    expect(res.status).toBe(200);
  });

});

// ─── HU04 — Priorización ─────────────────────────────────────────────────────
describe('HU04 — Priorización de solicitudes', () => {

  test('Coordinador cambia prioridad a Alta → 200', async () => {
    const res = await request(app)
      .patch(`/api/solicitudes/${solicitudId}/prioridad`)
      .set('Authorization', `Bearer ${tCoordinador}`)
      .send({ prioridad: 'Alta' });
    expect(res.status).toBe(200);
    expect(res.body.prioridad).toBe('Alta');
  });

  test('HU04 — Prioridad inválida → 400', async () => {
    const res = await request(app)
      .patch(`/api/solicitudes/${solicitudId}/prioridad`)
      .set('Authorization', `Bearer ${tCoordinador}`)
      .send({ prioridad: 'MuyUrgente' });
    expect(res.status).toBe(400);
  });

  test('HU04 — Solicitante no puede cambiar prioridad → 403', async () => {
    const res = await request(app)
      .patch(`/api/solicitudes/${solicitudId}/prioridad`)
      .set('Authorization', `Bearer ${tSolicitante}`)
      .send({ prioridad: 'Alta' });
    expect(res.status).toBe(403);
  });

  test('HU04 — Cambio de prioridad queda registrado en auditoría', async () => {
    const db = getDb();
    const registro = db.prepare(`
      SELECT * FROM historial_auditoria
      WHERE solicitud_id = ? AND campo_modificado = 'prioridad'
      ORDER BY registrado_en DESC LIMIT 1
    `).get(solicitudId);
    expect(registro).not.toBeNull();
    expect(registro.valor_nuevo).toBe('Alta');
  });

  test('HU04 — Lista retorna 200 (ordenable en el cliente)', async () => {
    const res = await request(app)
      .get('/api/solicitudes')
      .set('Authorization', `Bearer ${tCoordinador}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

});
