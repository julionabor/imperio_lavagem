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

describe('POST /api/v1/public/assistant/recommend', () => {
  it('devolve recomendação (sem viaturas → lista vazia)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/assistant/recommend',
      payload: { uso: 'Cidade', fam: 'Só eu ou a dois', orc: 'Até 300 €', fuel: 'Diesel' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ vehicles: unknown[]; exact: boolean }>();
    expect(Array.isArray(body.vehicles)).toBe(true);
    expect(typeof body.exact).toBe('boolean');
  });

  it('devolve 400 com body inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/public/assistant/recommend',
      payload: { uso: 'Cidade' }, // faltam campos
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/admin/assistant/settings', () => {
  it('ADMIN lê definições do assistente', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/assistant/settings',
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
  });
});
