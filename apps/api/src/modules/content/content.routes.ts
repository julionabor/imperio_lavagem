import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import * as repo from './content.repository.ts';
import { notFound, forbidden, problemFromZod } from '../../shared/errors.ts';
import { prisma } from '../../shared/prisma-client.ts';

function editorOrAbove(role: string) {
  return ['ADMIN', 'EDITOR'].includes(role);
}

export async function contentRoutes(app: FastifyInstance): Promise<void> {
  // ── Endpoint público principal ─────────────────────────────────────────
  // GET /public/site — tudo o que a homepage precisa num só pedido
  app.get('/public/site', async (_req, rep) => {
    const [
      settings,
      homeContent,
      navItems,
      advantages,
      testimonials,
      quickFilters,
      searchExamples,
      defaultProduct,
      assistantSettings,
      vehicleCount,
    ] = await Promise.all([
      prisma.siteSettings.findFirst(),
      prisma.homeContent.findFirst(),
      prisma.navItem.findMany({ where: { active: true }, orderBy: { position: 'asc' } }),
      prisma.advantage.findMany({ where: { active: true }, orderBy: { position: 'asc' } }),
      prisma.testimonial.findMany({ where: { active: true }, orderBy: { position: 'asc' } }),
      prisma.quickFilter.findMany({ where: { active: true }, orderBy: { position: 'asc' } }),
      prisma.searchExample.findMany({ where: { active: true }, orderBy: { position: 'asc' } }),
      prisma.financingProduct.findFirst({ where: { isDefault: true, active: true } }),
      prisma.assistantSettings.findFirst({ include: { steps: { orderBy: { position: 'asc' } } } }),
      prisma.vehicle.count({ where: { status: { in: ['PUBLISHED', 'RESERVED'] } } }),
    ]);

    // Dicionário para o parser de pesquisa
    const brands = await prisma.brand.findMany({
      where: { active: true },
      select: {
        name: true, slug: true, aliases: true,
        models: { where: { active: true }, select: { name: true, slug: true, aliases: true } },
      },
    });
    const synonyms = await prisma.searchSynonym.findMany({ where: { active: true } });

    return rep
      .header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      .send({
        settings,
        homeContent,
        navItems,
        advantages,
        testimonials,
        quickFilters,
        searchExamples,
        vehicleCount,
        defaultProduct,
        assistantSettings,
        parserDictionary: { brands, synonyms },
      });
  });

  // GET /public/pages/:slug
  app.get('/public/pages/:slug', async (req, rep) => {
    const { slug } = req.params as { slug: string };
    const page = await repo.findLegalPageBySlug(slug);
    if (!page) return notFound(rep);
    return rep.header('Cache-Control', 'public, max-age=300').send(page);
  });

  // ── Admin — HomeContent ────────────────────────────────────────────────

  app.get('/admin/content/home', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.getHomeContent());
  });

  app.put('/admin/content/home', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const updated = await repo.upsertHomeContent(req.body as never);
    return rep.send(updated);
  });

  // ── Admin — AboutContent ───────────────────────────────────────────────

  app.get('/admin/content/about', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.getAboutContent());
  });

  app.put('/admin/content/about', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    return rep.send(await repo.upsertAboutContent(req.body as never));
  });

  // ── Admin — Advantages ─────────────────────────────────────────────────

  app.get('/admin/content/advantages', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.listAdvantages());
  });

  app.post('/admin/content/advantages', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      icon: z.string().min(1),
      title: z.string().min(1),
      text: z.string().min(1),
      position: z.number().int().min(0).default(0),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    return rep.status(201).send(await repo.createAdvantage(p.data));
  });

  app.patch('/admin/content/advantages/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    return rep.send(await repo.updateAdvantage(id, req.body as never));
  });

  app.delete('/admin/content/advantages/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    await repo.deleteAdvantage(id);
    return rep.status(204).send();
  });

  // ── Admin — Testimonials ───────────────────────────────────────────────

  app.get('/admin/content/testimonials', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.listTestimonials());
  });

  app.post('/admin/content/testimonials', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      authorName: z.string().min(1),
      text: z.string().min(1),
      vehicleLabel: z.string().min(1),
      photoUrl: z.string().optional(),
      position: z.number().int().min(0).default(0),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    const initials = p.data.authorName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    return rep.status(201).send(await repo.createTestimonial({ ...p.data, initials }));
  });

  app.patch('/admin/content/testimonials/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    return rep.send(await repo.updateTestimonial(id, req.body as never));
  });

  app.delete('/admin/content/testimonials/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    await repo.deleteTestimonial(req.params as never);
    return rep.status(204).send();
  });

  // ── Admin — QuickFilters ───────────────────────────────────────────────

  app.get('/admin/content/quick-filters', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.listQuickFilters());
  });

  app.post('/admin/content/quick-filters', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      label: z.string().min(1),
      filters: z.record(z.string(), z.unknown()),
      position: z.number().int().min(0).default(0),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    return rep.status(201).send(await repo.createQuickFilter(p.data));
  });

  app.patch('/admin/content/quick-filters/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    return rep.send(await repo.updateQuickFilter(id, req.body as never));
  });

  app.delete('/admin/content/quick-filters/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    await repo.deleteQuickFilter(id);
    return rep.status(204).send();
  });

  // ── Admin — SearchExamples ─────────────────────────────────────────────

  app.get('/admin/content/search-examples', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.listSearchExamples());
  });

  app.post('/admin/content/search-examples', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({ text: z.string().min(1), position: z.number().int().min(0).default(0) });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    return rep.status(201).send(await repo.createSearchExample(p.data));
  });

  app.patch('/admin/content/search-examples/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    return rep.send(await repo.updateSearchExample(id, req.body as never));
  });

  // ── Admin — NavItems ───────────────────────────────────────────────────

  app.get('/admin/content/nav-items', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.listNavItems());
  });

  app.post('/admin/content/nav-items', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      label: z.string().min(1),
      route: z.string().optional(),
      url: z.string().optional(),
      position: z.number().int().min(0).default(0),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    return rep.status(201).send(await repo.createNavItem(p.data));
  });

  app.patch('/admin/content/nav-items/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    return rep.send(await repo.updateNavItem(id, req.body as never));
  });

  // ── Admin — LegalPages ─────────────────────────────────────────────────

  app.get('/admin/content/legal-pages', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.listLegalPages());
  });

  app.put('/admin/content/legal-pages/:slug', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!editorOrAbove(req.user!.role)) return forbidden(rep);
    const { slug } = req.params as { slug: string };
    const schema = z.object({ title: z.string().min(1), body: z.string() });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    return rep.send(await repo.upsertLegalPage(slug, p.data));
  });
}
