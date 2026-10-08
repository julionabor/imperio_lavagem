import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../main.ts';
import type { FastifyInstance } from 'fastify';
import { setupTestDb, teardownTestDb, createAndLoginUser, authHeader } from '../../shared/test-helpers.ts';

let app: FastifyInstance;
let adminToken: string;
let editorToken: string;

beforeAll(async () => {
  await setupTestDb();
  app = await buildApp();
  await app.ready();
  ({ token: adminToken } = await createAndLoginUser(app, 'ADMIN'));
  ({ token: editorToken } = await createAndLoginUser(app, 'EDITOR'));
});

afterAll(async () => {
  await app.close();
  await teardownTestDb();
});

describe('GET /api/v1/admin/settings', () => {
  it('ADMIN lê definições', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/settings',
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('PUT /api/v1/admin/settings', () => {
  it('ADMIN atualiza definições', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/settings',
      headers: authHeader(adminToken),
      payload: { companyName: 'Private Motors Teste', email: 'test@pm.pt' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ companyName: string }>().companyName).toBe('Private Motors Teste');
  });

  it('EDITOR não pode alterar definições', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/settings',
      headers: authHeader(editorToken),
      payload: { companyName: 'Hack' },
    });
    expect(res.statusCode).toBe(403);
  });
});
