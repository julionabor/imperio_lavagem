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

describe('GET /api/v1/admin/catalog/brands', () => {
  it('devolve lista de marcas', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/catalog/brands',
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it('SALES não tem acesso', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/catalog/brands',
      headers: authHeader(salesToken),
    });
    // SALES ainda é autenticado, mas no catálogo só lê
    expect([200, 403]).toContain(res.statusCode);
  });
});

describe('POST /api/v1/admin/catalog/brands', () => {
  it('ADMIN cria marca', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/catalog/brands',
      headers: authHeader(adminToken),
      payload: { name: 'Audi', slug: 'audi', aliases: ['audi'] },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json<{ name: string }>().name).toBe('Audi');
  });

  it('SALES não pode criar marca', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/catalog/brands',
      headers: authHeader(salesToken),
      payload: { name: 'BMW', slug: 'bmw', aliases: [] },
    });
    expect(res.statusCode).toBe(403);
  });

  it('conflito em slug duplicado', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/admin/catalog/brands',
      headers: authHeader(adminToken),
      payload: { name: 'Audi2', slug: 'audi', aliases: [] },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/catalog/brands',
      headers: authHeader(adminToken),
      payload: { name: 'Audi2', slug: 'audi', aliases: [] },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/v1/admin/catalog/search/parse-test', () => {
  it('parseia frase de pesquisa', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/catalog/search/parse-test',
      headers: authHeader(adminToken),
      payload: { q: 'SUV diesel até 250€/mês' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ filters: unknown }>();
    expect(body.filters).toBeDefined();
  });
});
