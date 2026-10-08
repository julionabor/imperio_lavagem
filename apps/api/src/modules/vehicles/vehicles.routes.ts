import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import * as service from './vehicles.service.ts';
import * as repo from './vehicles.repository.ts';
import * as mapper from './vehicles.mapper.ts';
import { notFound, problemFromZod, forbidden, unprocessable, gone } from '../../shared/errors.ts';
import { auditLog } from '../../shared/audit.ts';
import type { UserRole } from '@prisma/client';

export async function vehicleRoutes(app: FastifyInstance): Promise<void> {
  // ── Públicas (sem auth) ─────────────────────────────────────────────────

  // GET /public/vehicles
  app.get('/public/vehicles', async (req, rep) => {
    const q = req.query as Record<string, string>;
    const result = await service.listVehicles({
      brand: q['brand'],
      model: q['model'],
      priceMax: q['priceMax'] ? Number(q['priceMax']) : undefined,
      yearMin: q['yearMin'] ? Number(q['yearMin']) : undefined,
      kmMax: q['kmMax'] ? Number(q['kmMax']) : undefined,
      fuel: q['fuel'],
      transmission: q['transmission'],
      bodyType: q['bodyType'],
      sort: (q['sort'] as service.ListQuery['sort']) ?? 'NEWEST',
      page: q['page'] ? Number(q['page']) : 1,
      pageSize: q['pageSize'] ? Number(q['pageSize']) : 9,
      budget: q['budget'] ? Number(q['budget']) : undefined,
      down: q['down'] ? Number(q['down']) : undefined,
      term: q['term'] ? Number(q['term']) : undefined,
    });
    return rep.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300').send(result);
  });

  // GET /public/vehicles/suggestions
  app.get('/public/vehicles/suggestions', async (req, rep) => {
    const q = req.query as Record<string, string>;
    const filter = {
      brand: q['brand'],
      model: q['model'],
      priceMax: q['priceMax'] ? Number(q['priceMax']) : undefined,
      yearMin: q['yearMin'] ? Number(q['yearMin']) : undefined,
      kmMax: q['kmMax'] ? Number(q['kmMax']) : undefined,
      fuel: q['fuel'] ? q['fuel'].split(',') : undefined,
      transmission: q['transmission'] ? q['transmission'].split(',') : undefined,
      bodyType: q['bodyType'] ? q['bodyType'].split(',') : undefined,
    };
    const suggestions = await service.getVehicleSuggestions(filter);
    return rep.header('Cache-Control', 'public, max-age=30').send(suggestions);
  });

  // GET /public/vehicles/:slug
  app.get('/public/vehicles/:slug', async (req, rep) => {
    const { slug } = req.params as { slug: string };
    const result = await service.getVehicleBySlug(slug);
    if (!result) return notFound(rep, `Viatura '${slug}' não encontrada.`);
    if (result.vehicle.status === 'SOLD') return gone(rep, 'Esta viatura já foi vendida.');
    if (!['PUBLISHED', 'RESERVED'].includes(result.vehicle.status)) {
      return notFound(rep);
    }
    return rep.header('Cache-Control', 'public, max-age=60').send(result.dto);
  });

  // GET /public/vehicles/:slug/similar
  app.get('/public/vehicles/:slug/similar', async (req, rep) => {
    const { slug } = req.params as { slug: string };
    const vehicle = await repo.findVehicleBySlug(slug);
    if (!vehicle) return notFound(rep);
    const similar = await service.getSimilarVehicles(vehicle.id, vehicle.bodyType, vehicle.priceCents);
    return rep.header('Cache-Control', 'public, max-age=60').send(similar);
  });

  // POST /public/vehicles/:slug/view
  app.post('/public/vehicles/:slug/view', async (req, rep) => {
    const { slug } = req.params as { slug: string };
    const vehicle = await repo.findVehicleBySlug(slug);
    if (!vehicle) return notFound(rep);
    await repo.incrementViewCount(vehicle.id);
    return rep.status(204).send();
  });

  // POST /public/vehicles/:slug/favorite
  app.post('/public/vehicles/:slug/favorite', async (req, rep) => {
    const { slug } = req.params as { slug: string };
    const vehicle = await repo.findVehicleBySlug(slug);
    if (!vehicle) return notFound(rep);
    const schema = z.object({ on: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);
    await repo.incrementFavoriteCount(vehicle.id, parsed.data.on ? 1 : -1);
    return rep.status(204).send();
  });

  // ── Admin ───────────────────────────────────────────────────────────────

  // GET /admin/vehicles
  app.get('/admin/vehicles', { preValidation: [app.authenticate] }, async (req, rep) => {
    const user = req.user!;
    const q = req.query as Record<string, string>;

    const filter = {
      brand: q['brand'],
      model: q['model'],
      fuel: q['fuel'] ? q['fuel'].split(',') : undefined,
      bodyType: q['bodyType'] ? q['bodyType'].split(',') : undefined,
      status: q['status'] ? q['status'].split(',') as never[] : undefined,
      withoutImages: q['withoutImages'] === 'true',
    };

    const { items, total } = await repo.listAdminVehicles(
      filter,
      (q['sort'] as service.VehicleSortKey) ?? 'NEWEST',
      Number(q['page']) || 1,
      Number(q['pageSize']) || 20,
    );
    const settings = await import('../../shared/prisma-client.ts').then(({ prisma }) =>
      prisma.siteSettings.findFirst({ select: { newBadgeDays: true } }),
    );

    return rep.send({
      data: items.map((v) => mapper.toAdminVehicle(v)),
      meta: { total, page: Number(q['page']) || 1, pageSize: Number(q['pageSize']) || 20 },
    });
  });

  // GET /admin/vehicles/:id
  app.get('/admin/vehicles/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    const vehicle = await repo.findVehicleById(id);
    if (!vehicle) return notFound(rep);
    return rep.send(mapper.toAdminVehicle(vehicle));
  });

  // POST /admin/vehicles
  app.post('/admin/vehicles', { preValidation: [app.authenticate] }, async (req, rep) => {
    const user = req.user!;
    if (!['ADMIN', 'EDITOR'].includes(user.role)) return forbidden(rep);

    const parsed = service.CreateVehicleSchema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    const dto = await service.createVehicle(parsed.data, user.id);
    await auditLog({ userId: user.id, action: 'CREATE', entity: 'Vehicle', entityId: dto['id'] as string, diff: {} });
    return rep.status(201).send(dto);
  });

  // PATCH /admin/vehicles/:id
  app.patch('/admin/vehicles/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    const user = req.user!;
    const { id } = req.params as { id: string };

    if (!['ADMIN', 'EDITOR'].includes(user.role)) return forbidden(rep);

    const vehicle = await repo.findVehicleById(id);
    if (!vehicle) return notFound(rep);

    const before = mapper.toAdminVehicle(vehicle);
    const updated = await repo.updateVehicle(id, { ...(req.body as object), updatedById: user.id });
    const after = mapper.toAdminVehicle(updated);
    await auditLog({ userId: user.id, action: 'UPDATE', entity: 'Vehicle', entityId: id, diff: { before, after } });
    return rep.send(after);
  });

  // POST /admin/vehicles/:id/status
  app.post('/admin/vehicles/:id/status', { preValidation: [app.authenticate] }, async (req, rep) => {
    const user = req.user!;
    const { id } = req.params as { id: string };
    const schema = z.object({ status: z.enum(['PUBLISHED', 'DRAFT', 'RESERVED', 'SOLD', 'ARCHIVED']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    const vehicle = await repo.findVehicleById(id);
    if (!vehicle) return notFound(rep);

    // SALES só pode RESERVED e SOLD
    if (user.role === 'SALES' && !['RESERVED', 'SOLD'].includes(parsed.data.status)) {
      return forbidden(rep, 'SALES só pode marcar como Reservado ou Vendido.');
    }

    // Publicar requer pelo menos 1 foto de capa
    if (parsed.data.status === 'PUBLISHED' && !vehicle.images.some((i) => i.isCover)) {
      return unprocessable(rep, 'Não é possível publicar sem foto de capa.');
    }

    const updated = await repo.changeVehicleStatus(id, parsed.data.status, user.id);
    await auditLog({ userId: user.id, action: 'UPDATE', entity: 'Vehicle', entityId: id, diff: { status: parsed.data.status } });
    return rep.send(mapper.toAdminVehicle(updated));
  });

  // POST /admin/vehicles/:id/duplicate
  app.post('/admin/vehicles/:id/duplicate', { preValidation: [app.authenticate] }, async (req, rep) => {
    const user = req.user!;
    if (!['ADMIN', 'EDITOR'].includes(user.role)) return forbidden(rep);
    const { id } = req.params as { id: string };

    const dto = await service.duplicateVehicle(id, user.id);
    if (!dto) return notFound(rep);
    await auditLog({ userId: user.id, action: 'CREATE', entity: 'Vehicle', entityId: dto['id'] as string, diff: { duplicatedFrom: id } });
    return rep.status(201).send(dto);
  });
}
