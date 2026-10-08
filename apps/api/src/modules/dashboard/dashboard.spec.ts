import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../main.ts';
import type { FastifyInstance } from 'fastify';
import { setupTestDb, teardownTestDb, createAndLoginUser, authHeader } from '../../shared/test-helpers.ts';

let app: FastifyInstance;
let adminToken: string;
let salesToken: string;

beforeAll(async () => {
  await setupTestDb();
  app = await buildApp();
  await app.ready();
  ({ token: adminToken } = await createAndLoginUser(app, 'ADMIN'));
  ({ token: salesToken } = await createAndLoginUser(app, 'SALES'));
});

afterAll(async () => {
  await app.close();
  await teardownTestDb();
});

describe('GET /api/v1/admin/dashboard/summary', () => {
  it('ADMIN vê resumo do dashboard', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/summary',
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ vehicles: unknown; leads: unknown }>();
    expect(body.vehicles).toBeDefined();
    expect(body.leads).toBeDefined();
  });

  it('SALES vê o dashboard', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/summary',
      headers: authHeader(salesToken),
    });
    expect(res.statusCode).toBe(200);
  });

  it('sem auth devolve 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/summary',
    });
    expect(res.statusCode).toBe(401);
  });
});
