import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../main.ts';
import type { FastifyInstance } from 'fastify';
import { setupTestDb, teardownTestDb, createAndLoginUser, authHeader } from '../../shared/test-helpers.ts';
import { prisma } from '../../shared/prisma-client.ts';

let app: FastifyInstance;
let adminToken: string;
let salesToken: string;

beforeAll(async () => {
  await setupTestDb();
  app = await buildApp();
  await app.ready();
  await prisma.siteSettings.create({ data: {} as never });
  ({ token: adminToken } = await createAndLoginUser(app, 'ADMIN'));
  ({ token: salesToken } = await createAndLoginUser(app, 'SALES'));
});

afterAll(async () => {
  await app.close();
  await teardownTestDb();
});

describe('GET /api/v1/public/site', () => {
  it('devolve dados do site', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/public/site' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ vehicleCount: number; parserDictionary: unknown }>();
    expect(typeof body.vehicleCount).toBe('number');
    expect(body.parserDictionary).toBeDefined();
  });
});

describe('PUT /api/v1/admin/content/home', () => {
  it('ADMIN atualiza home content', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/content/home',
      headers: authHeader(adminToken),
      payload: { heroTitle: 'Novo título', heroSubtitle: 'Novo subtítulo' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('SALES não pode atualizar', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/content/home',
      headers: authHeader(salesToken),
      payload: { heroTitle: 'Hack' },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/v1/admin/content/advantages', () => {
  it('ADMIN cria vantagem', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/content/advantages',
      headers: authHeader(adminToken),
      payload: { icon: 'shield-check', title: 'Garantia', text: 'Garantia total', position: 0 },
    });
    expect(res.statusCode).toBe(201);
  });
});

describe('GET /api/v1/public/pages/:slug', () => {
  it('devolve 404 para página inexistente', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/public/pages/nao-existe' });
    expect(res.statusCode).toBe(404);
  });

  it('devolve página legal após criação', async () => {
    await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/content/legal-pages/privacidade',
      headers: authHeader(adminToken),
      payload: { title: 'Privacidade', body: '# Privacidade\nConteúdo.' },
    });
    const res = await app.inject({ method: 'GET', url: '/api/v1/public/pages/privacidade' });
    expect(res.statusCode).toBe(200);
  });
});
