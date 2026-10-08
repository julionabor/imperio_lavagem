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

describe('GET /api/v1/admin/audit', () => {
  it('ADMIN vê log de auditoria', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/audit',
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[] }>();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('EDITOR não tem acesso ao audit', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/audit',
      headers: authHeader(editorToken),
    });
    expect(res.statusCode).toBe(403);
  });

  it('sem auth devolve 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/audit' });
    expect(res.statusCode).toBe(401);
  });
});
