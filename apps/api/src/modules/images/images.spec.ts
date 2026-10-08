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
let salesToken: string;

beforeAll(async () => {
  await setupTestDb();
  app = await buildApp();
  await app.ready();

  const brand = await prisma.brand.create({ data: { name: 'BMW', slug: 'bmw', aliases: [] } });
  const model = await prisma.model.create({ data: { brandId: brand.id, name: 'X5', slug: 'x5', aliases: [] } });

  ({ token: adminToken } = await createAndLoginUser(app, 'ADMIN'));
  ({ token: salesToken } = await createAndLoginUser(app, 'SALES'));
});

afterAll(async () => {
  await app.close();
  await teardownTestDb();
});

describe('POST /api/v1/admin/vehicles/:vehicleId/images', () => {
  it('SALES não pode fazer upload', async () => {
    const vehicle = await prisma.vehicle.findFirst();
    if (!vehicle) return;
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/vehicles/${vehicle.id}/images`,
      headers: authHeader(salesToken),
    });
    expect(res.statusCode).toBe(403);
  });

  it('devolve 404 para viatura inexistente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/vehicles/00000000-0000-0000-0000-000000000000/images`,
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(404);
  });
});
