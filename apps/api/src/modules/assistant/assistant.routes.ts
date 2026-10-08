import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import * as repo from './assistant.repository.ts';
import { notFound, forbidden, problemFromZod } from '../../shared/errors.ts';
import { recommend } from '@pm/libs/assistant';
import { FUEL_LABELS, BODY_LABELS } from '@pm/libs/contracts';

export async function assistantRoutes(app: FastifyInstance): Promise<void> {
  // POST /public/assistant/recommend
  app.post('/public/assistant/recommend', async (req, rep) => {
    const schema = z.object({
      uso: z.string(),
      fam: z.string(),
      orc: z.string(),
      fuel: z.string(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    const vehicles = await repo.getPublishedVehiclesForRecommend();

    // Converte enums do DB para labels do protótipo
    const forRecommend = vehicles.map((v) => ({
      id: v.id,
      priceCents: v.priceCents,
      fuel: FUEL_LABELS[v.fuel] ?? v.fuel,
      bodyType: BODY_LABELS[v.bodyType] ?? v.bodyType,
    }));

    const result = recommend(forRecommend, parsed.data);

    // Devolve os IDs + dados básicos das viaturas
    const selected = result.ids
      .map((id) => vehicles.find((v) => v.id === id))
      .filter(Boolean)
      .map((v) => ({
        id: v!.id,
        brand: v!.brand.name,
        model: v!.model.name,
        priceCents: v!.priceCents,
        coverImage: v!.images[0] ?? null,
      }));

    return rep.send({ vehicles: selected, exact: result.exact });
  });

  // GET /admin/assistant/settings
  app.get('/admin/assistant/settings', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.getAssistantSettings());
  });

  // PUT /admin/assistant/settings
  app.put('/admin/assistant/settings', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!['ADMIN', 'EDITOR'].includes(req.user!.role)) return forbidden(rep);
    return rep.send(await repo.upsertAssistantSettings(req.body as Record<string, unknown>));
  });

  // GET /admin/assistant/steps
  app.get('/admin/assistant/steps', { preValidation: [app.authenticate] }, async (_req, rep) => {
    const settings = await repo.getAssistantSettings();
    if (!settings) return rep.send([]);
    return rep.send(await repo.listSteps(settings.id));
  });

  // POST /admin/assistant/steps
  app.post('/admin/assistant/steps', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!['ADMIN', 'EDITOR'].includes(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      key: z.string().min(1),
      question: z.string().min(1),
      position: z.number().int().min(0).default(0),
      options: z.array(z.record(z.string(), z.unknown())),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    let settings = await repo.getAssistantSettings();
    if (!settings) {
      settings = await repo.upsertAssistantSettings({});
    }

    const step = await repo.createStep({ ...parsed.data, settingsId: settings.id });
    return rep.status(201).send(step);
  });

  // PATCH /admin/assistant/steps/:id
  app.patch('/admin/assistant/steps/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!['ADMIN', 'EDITOR'].includes(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    return rep.send(await repo.updateStep(id, req.body as never));
  });

  // DELETE /admin/assistant/steps/:id
  app.delete('/admin/assistant/steps/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!['ADMIN', 'EDITOR'].includes(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    await repo.deleteStep(id).catch(() => null);
    return rep.status(204).send();
  });

  // PATCH /admin/assistant/steps/reorder
  app.patch('/admin/assistant/steps/reorder', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!['ADMIN', 'EDITOR'].includes(req.user!.role)) return forbidden(rep);
    const schema = z.object({ ids: z.array(z.string().uuid()) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);
    await repo.reorderSteps(parsed.data.ids);
    return rep.status(204).send();
  });

  // POST /admin/assistant/test — testa a recomendação contra stock atual
  app.post('/admin/assistant/test', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!['ADMIN', 'EDITOR'].includes(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      uso: z.string(),
      fam: z.string(),
      orc: z.string(),
      fuel: z.string(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    const vehicles = await repo.getPublishedVehiclesForRecommend();
    const forRecommend = vehicles.map((v) => ({
      id: v.id,
      priceCents: v.priceCents,
      fuel: FUEL_LABELS[v.fuel] ?? v.fuel,
      bodyType: BODY_LABELS[v.bodyType] ?? v.bodyType,
    }));

    const result = recommend(forRecommend, parsed.data);
    return rep.send(result);
  });
}
