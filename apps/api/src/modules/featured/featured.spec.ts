import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../main.ts';
import type { FastifyInstance } from 'fastify';
import { setupTestDb, teardownTestDb, createAndLoginUser, authHeader } from '../../shared/test-helpers.ts';

let app: FastifyInstance;
let adminToken: string;

beforeAll(async () => {
  await setupTestDb();
  app = await buildApp();
  await app.ready();
  ({ token: adminToken } = await createAndLoginUser(app, 'ADMIN'));
});

afterAll(async () => {
  await app.close();
  await teardownTestDb();
});

describe('GET /api/v1/public/featured', () => {
  it('devolve lista (vazia quando não há destaques)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/featured?placement=HOME_FEATURED',
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });
});

describe('PUT /api/v1/admin/featured/:placement', () => {
  it('substitui a lista de destaques', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/featured/HOME_FEATURED',
      headers: authHeader(adminToken),
      payload: { vehicleIds: [] },
    });
    expect(res.statusCode).toBe(204);
  });

  it('sem auth devolve 401', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/featured/HOME_FEATURED',
      payload: { vehicleIds: [] },
    });
    expect(res.statusCode).toBe(401);
  });
});
