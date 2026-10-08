import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import * as repo from './catalog.repository.ts';
import { notFound, forbidden, conflict, problemFromZod } from '../../shared/errors.ts';
import { parse } from '@pm/libs/search-parser';

function editorOrAbove(role: string) {
  return ['ADMIN', 'EDITOR'].includes(role);
}

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  // ── Marcas ──────────────────────────────────────────────────────────────

  app.get('/admin/catalog/brands', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.listBrands());
  });

  app.post('/admin/catalog/brands', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      logoUrl: z.string().optional(),
      aliases: z.array(z.string()).default([]),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    const brand = await repo.createBrand({ ...p.data, logoUrl: p.data.logoUrl ?? null, active: true }).catch(() => null);
    if (!brand) return conflict(rep, 'Já existe uma marca com este slug.');
    return rep.status(201).send(brand);
  });

  app.patch('/admin/catalog/brands/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    const brand = await repo.findBrandById(id);
    if (!brand) return notFound(rep);
    const updated = await repo.updateBrand(id, req.body as never);
    return rep.send(updated);
  });

  app.delete('/admin/catalog/brands/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);
    const { id } = req.params as { id: string };
    await repo.deleteBrand(id).catch(() => conflict(rep, 'Marca em uso — desative em vez de eliminar.'));
    return rep.status(204).send();
  });

  // ── Modelos ─────────────────────────────────────────────────────────────

  app.get('/admin/catalog/models', { preValidation: [app.authenticate] }, async (req, rep) => {
    const q = req.query as { brandId?: string };
    return rep.send(await repo.listModels(q.brandId));
  });

  app.post('/admin/catalog/models', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      brandId: z.string().uuid(),
      name: z.string().min(1),
      slug: z.string().min(1),
      aliases: z.array(z.string()).default([]),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    const model = await repo.createModel({ ...p.data, active: true }).catch(() => null);
    if (!model) return conflict(rep, 'Já existe um modelo com este slug nesta marca.');
    return rep.status(201).send(model);
  });

  app.patch('/admin/catalog/models/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    const model = await repo.findModelById(id);
    if (!model) return notFound(rep);
    return rep.send(await repo.updateModel(id, req.body as never));
  });

  // ── Equipamentos ─────────────────────────────────────────────────────────

  app.get('/admin/catalog/equipment', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.listEquipment());
  });

  app.post('/admin/catalog/equipment', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      name: z.string().min(1),
      category: z.enum(['SAFETY', 'COMFORT', 'MULTIMEDIA', 'EXTERIOR', 'INTERIOR', 'DRIVING']),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    return rep.status(201).send(await repo.createEquipment({ ...p.data, active: true }));
  });

  app.patch('/admin/catalog/equipment/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    const item = await repo.findEquipmentById(id);
    if (!item) return notFound(rep);
    return rep.send(await repo.updateEquipment(id, req.body as never));
  });

  // ── Sinónimos ────────────────────────────────────────────────────────────

  app.get('/admin/catalog/search-synonyms', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.listSynonyms());
  });

  app.post('/admin/catalog/search-synonyms', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      term: z.string().min(1),
      maps_to: z.string().min(1),
      category: z.enum(['fuel', 'body', 'gear', 'brand']),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    const synonym = await repo.createSynonym({ ...p.data, active: true }).catch(() => null);
    if (!synonym) return conflict(rep, 'Já existe um sinónimo com este termo.');
    return rep.status(201).send(synonym);
  });

  app.patch('/admin/catalog/search-synonyms/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    const s = await repo.findSynonymById(id);
    if (!s) return notFound(rep);
    return rep.send(await repo.updateSynonym(id, req.body as never));
  });

  app.delete('/admin/catalog/search-synonyms/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    await repo.deleteSynonym(id).catch(() => null);
    return rep.status(204).send();
  });

  // Teste do parser de pesquisa
  app.post('/admin/catalog/search/parse-test', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({ q: z.string() });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    const result = parse(p.data.q);
    return rep.send({ query: p.data.q, filters: result });
  });
}
