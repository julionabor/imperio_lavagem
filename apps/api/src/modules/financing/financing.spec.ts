import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../main.ts';
import type { FastifyInstance } from 'fastify';
import { setupTestDb, teardownTestDb, createAndLoginUser, authHeader } from '../../shared/test-helpers.ts';
import { prisma } from '../../shared/prisma-client.ts';

let app: FastifyInstance;
let adminToken: string;
let editorToken: string;

beforeAll(async () => {
  await setupTestDb();
  app = await buildApp();
  await app.ready();
  await prisma.financingProduct.create({
    data: {
      name: 'Produto Teste',
      lenderName: 'Banco X',
      isDefault: true,
      active: true,
      rateMode: 'TAEG_INPUT',
      taegBp: 1500,
      allowedTerms: [24, 48, 96],
      defaultTermMonths: 96,
    },
  });
  ({ token: adminToken } = await createAndLoginUser(app, 'ADMIN'));
  ({ token: editorToken } = await createAndLoginUser(app, 'EDITOR'));
});

afterAll(async () => {
  await app.close();
  await teardownTestDb();
});

describe('GET /api/v1/admin/financing-products', () => {
  it('ADMIN vê produtos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/financing-products',
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(body.length).toBeGreaterThan(0);
  });

  it('EDITOR vê produtos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/financing-products',
      headers: authHeader(editorToken),
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('POST /api/v1/admin/financing-products/simulate', () => {
  it('calcula prestação correctamente (TAEG 15%, 20000€, 96 meses)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/financing-products/simulate',
      headers: authHeader(adminToken),
      payload: { priceCents: 2000000, entryCents: 0, termMonths: 96 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ monthlyPaymentCents: number }>();
    // ~289 €/mês com TAEG 15% (valor aproximado)
    expect(body.monthlyPaymentCents).toBeGreaterThan(25000);
    expect(body.monthlyPaymentCents).toBeLessThan(35000);
  });
});

describe('POST /api/v1/admin/financing-products/:id/default', () => {
  it('EDITOR não pode definir produto padrão', async () => {
    const product = await prisma.financingProduct.findFirst();
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/financing-products/${product!.id}/default`,
      headers: authHeader(editorToken),
    });
    expect(res.statusCode).toBe(403);
  });
});
