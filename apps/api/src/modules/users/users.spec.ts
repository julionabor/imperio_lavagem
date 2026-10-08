import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../main.ts';
import type { FastifyInstance } from 'fastify';
import { setupTestDb, teardownTestDb, createAndLoginUser, authHeader } from '../../shared/test-helpers.ts';

let app: FastifyInstance;
let adminToken: string;
let editorToken: string;
let salesToken: string;

beforeAll(async () => {
  await setupTestDb();
  app = await buildApp();
  await app.ready();
  ({ token: adminToken } = await createAndLoginUser(app, 'ADMIN'));
  ({ token: editorToken } = await createAndLoginUser(app, 'EDITOR'));
  ({ token: salesToken } = await createAndLoginUser(app, 'SALES'));
});

afterAll(async () => {
  await app.close();
  await teardownTestDb();
});

describe('GET /api/v1/admin/users', () => {
  it('ADMIN lista utilizadores', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users',
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[] }>();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('EDITOR não pode listar utilizadores', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users',
      headers: authHeader(editorToken),
    });
    expect(res.statusCode).toBe(403);
  });

  it('SALES não pode listar utilizadores', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users',
      headers: authHeader(salesToken),
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/v1/admin/users', () => {
  it('ADMIN cria utilizador', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: authHeader(adminToken),
      payload: { name: 'Novo User', email: 'novo@pm.pt', role: 'SALES' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json<{ role: string }>().role).toBe('SALES');
  });

  it('email duplicado devolve 409', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: authHeader(adminToken),
      payload: { name: 'User2', email: 'dup@pm.pt', role: 'SALES' },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: authHeader(adminToken),
      payload: { name: 'User2b', email: 'dup@pm.pt', role: 'EDITOR' },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('PATCH /api/v1/admin/users/:id', () => {
  it('ADMIN desativa utilizador', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: authHeader(adminToken),
      payload: { name: 'To Disable', email: 'disable@pm.pt', role: 'SALES' },
    });
    const { id } = createRes.json<{ id: string }>();

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/users/${id}`,
      headers: authHeader(adminToken),
      payload: { active: false },
    });
    expect(res.statusCode).toBe(200);
  });
});
