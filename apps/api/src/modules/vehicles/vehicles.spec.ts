import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../main.ts';
import type { FastifyInstance } from 'fastify';
import {
  setupTestDb,
  teardownTestDb,
  createAndLoginUser,
  authHeader,
} from '../../shared/test-helpers.ts';
import { prisma } from '../../shared/prisma-client.ts';

let app: FastifyInstance;
let adminToken: string;
let editorToken: string;
let salesToken: string;

beforeAll(async () => {
  await setupTestDb();
  app = await buildApp();
  await app.ready();

  // Cria marcas, modelos e produto de financiamento para os testes
  const brand = await prisma.brand.create({
    data: { name: 'Toyota', slug: 'toyota', aliases: ['toyota'] },
  });
  await prisma.model.create({
    data: { brandId: brand.id, name: 'C-HR', slug: 'c-hr', aliases: [] },
  });
  await prisma.financingProduct.create({
    data: {
      name: 'Produto Padrão',
      lenderName: 'Banco Teste',
      isDefault: true,
      active: true,
      rateMode: 'TAEG_INPUT',
      taegBp: 1500,
      allowedTerms: [24, 36, 48, 60, 72, 84, 96],
      defaultTermMonths: 96,
    },
  });
  await prisma.siteSettings.create({ data: {} as never });

  ({ token: adminToken } = await createAndLoginUser(app, 'ADMIN'));
  ({ token: editorToken } = await createAndLoginUser(app, 'EDITOR'));
  ({ token: salesToken } = await createAndLoginUser(app, 'SALES'));
});

afterAll(async () => {
  await app.close();
  await teardownTestDb();
});

describe('GET /api/v1/public/vehicles', () => {
  it('devolve lista vazia quando não há viaturas publicadas', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/public/vehicles' });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[]; meta: { total: number } }>();
    expect(body.meta.total).toBe(0);
    expect(body.data).toHaveLength(0);
  });
});

describe('POST /api/v1/admin/vehicles', () => {
  it('ADMIN cria viatura com sucesso', async () => {
    const brand = await prisma.brand.findFirst({ where: { slug: 'toyota' } });
    const model = await prisma.model.findFirst({ where: { slug: 'c-hr' } });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/vehicles',
      headers: authHeader(adminToken),
      payload: {
        brandId: brand!.id,
        modelId: model!.id,
        version: '1.8 Hybrid Active',
        condition: 'USED',
        registrationYear: 2022,
        mileageKm: 35000,
        fuel: 'HYBRID',
        transmission: 'AUTOMATIC',
        bodyType: 'SUV',
        priceCents: 2800000,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ slug: string; status: string }>();
    expect(body.status).toBe('DRAFT');
    expect(body.slug).toContain('toyota');
  });

  it('SALES não pode criar viatura', async () => {
    const brand = await prisma.brand.findFirst();
    const model = await prisma.model.findFirst();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/vehicles',
      headers: authHeader(salesToken),
      payload: {
        brandId: brand!.id,
        modelId: model!.id,
        version: '1.8',
        condition: 'USED',
        registrationYear: 2020,
        mileageKm: 0,
        fuel: 'HYBRID',
        transmission: 'AUTOMATIC',
        bodyType: 'SUV',
        priceCents: 1000000,
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('sem autenticação devolve 401', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/vehicles', payload: {} });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/admin/vehicles/:id/status', () => {
  it('não pode publicar sem foto de capa', async () => {
    const vehicle = await prisma.vehicle.findFirst({ where: { status: 'DRAFT' } });
    if (!vehicle) return;

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/vehicles/${vehicle.id}/status`,
      headers: authHeader(adminToken),
      payload: { status: 'PUBLISHED' },
    });
    expect(res.statusCode).toBe(422);
  });

  it('SALES só pode marcar como RESERVED ou SOLD', async () => {
    const vehicle = await prisma.vehicle.findFirst({ where: { status: 'DRAFT' } });
    if (!vehicle) return;

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/vehicles/${vehicle.id}/status`,
      headers: authHeader(salesToken),
      payload: { status: 'ARCHIVED' },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/v1/public/vehicles/suggestions', () => {
  it('devolve lista de sugestões', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/vehicles/suggestions?fuel=DIESEL',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
  });
});
