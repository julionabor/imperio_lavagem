import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../shared/prisma-client.ts';
import { notFound, forbidden, problemFromZod } from '../../shared/errors.ts';
import { toSkipTake } from '../../shared/pagination.ts';

function salesOrAbove(role: string) {
  return ['ADMIN', 'EDITOR', 'SALES'].includes(role);
}
function adminOnly(role: string) {
  return role === 'ADMIN';
}

export async function crmRoutes(app: FastifyInstance): Promise<void> {
  // ══════════════════════════════════════════════════════════════
  // PIPELINE STAGES
  // ══════════════════════════════════════════════════════════════

  app.get('/admin/pipeline-stages', { preValidation: [app.authenticate] }, async (_req, rep) => {
    const stages = await prisma.pipelineStage.findMany({ orderBy: { position: 'asc' } });
    return rep.send(stages);
  });

  app.post('/admin/pipeline-stages', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!adminOnly(req.user!.role)) return forbidden(rep);
    const schema = z.object({
      name: z.string().min(1),
      position: z.number().int().min(0).default(0),
      kind: z.enum(['OPEN', 'WON', 'LOST']).default('OPEN'),
      color: z.string().min(1).default('gray'),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    const stage = await prisma.pipelineStage.create({ data: p.data });
    return rep.status(201).send(stage);
  });

  app.patch('/admin/pipeline-stages/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!adminOnly(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    const schema = z.object({
      name: z.string().min(1).optional(),
      position: z.number().int().min(0).optional(),
      kind: z.enum(['OPEN', 'WON', 'LOST']).optional(),
      color: z.string().min(1).optional(),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    const stage = await prisma.pipelineStage.update({ where: { id }, data: p.data });
    return rep.send(stage);
  });

  app.delete('/admin/pipeline-stages/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!adminOnly(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    const inUse = await prisma.lead.count({ where: { stageId: id } });
    if (inUse > 0) {
      return rep.status(409).send({ type: 'about:blank', title: 'Conflict', status: 409, detail: 'Stage em uso por leads.' });
    }
    await prisma.pipelineStage.delete({ where: { id } });
    return rep.status(204).send();
  });

  app.patch('/admin/pipeline-stages/reorder', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!adminOnly(req.user!.role)) return forbidden(rep);
    const schema = z.object({ ids: z.array(z.string().uuid()) });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    await prisma.$transaction(p.data.ids.map((id, i) =>
      prisma.pipelineStage.update({ where: { id }, data: { position: i } }),
    ));
    return rep.status(204).send();
  });

  // ══════════════════════════════════════════════════════════════
  // TAGS
  // ══════════════════════════════════════════════════════════════

  app.get('/admin/tags', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await prisma.tag.findMany({ orderBy: { name: 'asc' } }));
  });

  app.post('/admin/tags', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!salesOrAbove(req.user!.role)) return forbidden(rep);
    const schema = z.object({ name: z.string().min(1), color: z.string().min(1).default('gray') });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    const tag = await prisma.tag.create({ data: p.data });
    return rep.status(201).send(tag);
  });

  app.patch('/admin/tags/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!salesOrAbove(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    const schema = z.object({ name: z.string().min(1).optional(), color: z.string().min(1).optional() });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);
    return rep.send(await prisma.tag.update({ where: { id }, data: p.data }));
  });

  app.delete('/admin/tags/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!adminOnly(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    await prisma.tag.delete({ where: { id } });
    return rep.status(204).send();
  });

  // ══════════════════════════════════════════════════════════════
  // CONTACTS
  // ══════════════════════════════════════════════════════════════

  app.get('/admin/contacts', { preValidation: [app.authenticate] }, async (req, rep) => {
    const q = req.query as { q?: string; lifecycle?: string; page?: string; pageSize?: string };
    const page = Number(q.page) || 1;
    const pageSize = Math.min(50, Number(q.pageSize) || 20);
    const { skip, take } = toSkipTake(page, pageSize);

    const where: Record<string, unknown> = {};
    if (q.q) {
      where['OR'] = [
        { name: { contains: q.q, mode: 'insensitive' } },
        { phone: { contains: q.q } },
        { email: { contains: q.q, mode: 'insensitive' } },
      ];
    }
    if (q.lifecycle) where['lifecycle'] = q.lifecycle;

    const [contacts, total] = await prisma.$transaction([
      prisma.contact.findMany({
        where,
        skip,
        take,
        orderBy: { lastInteractionAt: 'desc' },
        include: {
          tags: true,
          _count: { select: { leads: true, activities: true } },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return rep.send({ data: contacts, meta: { total, page, pageSize } });
  });

  // GET /admin/contacts/export.csv
  app.get('/admin/contacts/export.csv', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role === 'SALES') return forbidden(rep);
    const contacts = await prisma.contact.findMany({
      where: { consentMarketing: true, anonymizedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { name: true, phone: true, email: true, locality: true, lifecycle: true, createdAt: true },
    });

    const header = 'Nome,Telemóvel,Email,Localidade,Fase,Data\n';
    const rows = contacts.map((c) =>
      [c.name, c.phone, c.email ?? '', c.locality ?? '', c.lifecycle, c.createdAt.toISOString()].join(','),
    ).join('\n');

    return rep
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="contactos.csv"')
      .send(header + rows);
  });

  app.get('/admin/contacts/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        tags: true,
        leads: {
          orderBy: { createdAt: 'desc' },
          include: {
            stage: { select: { name: true, color: true } },
            vehicle: { select: { slug: true, brand: { select: { name: true } }, model: { select: { name: true } } } },
          },
        },
        activities: { orderBy: { occurredAt: 'desc' }, include: { author: { select: { name: true } } } },
        tasks: { orderBy: { dueAt: 'asc' }, include: { assignee: { select: { name: true } } } },
      },
    });
    if (!contact) return notFound(rep);
    return rep.send(contact);
  });

  app.patch('/admin/contacts/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    const schema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional().nullable(),
      locality: z.string().optional().nullable(),
      preferredContact: z.enum(['PHONE', 'WHATSAPP', 'EMAIL']).optional().nullable(),
      lifecycle: z.enum(['LEAD', 'PROSPECT', 'CUSTOMER', 'INACTIVE']).optional(),
      ownerId: z.string().uuid().optional().nullable(),
      tagIds: z.array(z.string().uuid()).optional(),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);

    const { tagIds, ...data } = p.data;
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...data,
        ...(tagIds !== undefined ? { tags: { set: tagIds.map((tid) => ({ id: tid })) } } : {}),
      },
      include: { tags: true },
    });
    return rep.send(contact);
  });

  app.post('/admin/contacts/merge', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role === 'SALES') return forbidden(rep);
    const schema = z.object({ keepId: z.string().uuid(), mergeId: z.string().uuid() });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);

    const { keepId, mergeId } = p.data;
    if (keepId === mergeId) {
      return rep.status(400).send({ type: 'about:blank', title: 'Bad Request', status: 400, detail: 'IDs iguais.' });
    }

    await prisma.$transaction([
      prisma.lead.updateMany({ where: { contactId: mergeId }, data: { contactId: keepId } }),
      prisma.activity.updateMany({ where: { contactId: mergeId }, data: { contactId: keepId } }),
      prisma.task.updateMany({ where: { contactId: mergeId }, data: { contactId: keepId } }),
      prisma.contact.update({ where: { id: keepId }, data: { lastInteractionAt: new Date() } }),
      prisma.contact.delete({ where: { id: mergeId } }),
    ]);

    return rep.send({ merged: true, contactId: keepId });
  });

  app.post('/admin/contacts/:id/anonymize', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role === 'SALES') return forbidden(rep);
    const { id } = req.params as { id: string };
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: 'Anonimizado',
        phone: `+00000${Date.now()}`,
        email: null,
        locality: null,
        anonymizedAt: new Date(),
      },
    });
    return rep.send(contact);
  });

  // ══════════════════════════════════════════════════════════════
  // ACTIVITIES
  // ══════════════════════════════════════════════════════════════

  app.get('/admin/contacts/:contactId/activities', { preValidation: [app.authenticate] }, async (req, rep) => {
    const { contactId } = req.params as { contactId: string };
    const activities = await prisma.activity.findMany({
      where: { contactId },
      orderBy: { occurredAt: 'desc' },
      include: { author: { select: { name: true } } },
    });
    return rep.send(activities);
  });

  app.post('/admin/contacts/:contactId/activities', { preValidation: [app.authenticate] }, async (req, rep) => {
    const { contactId } = req.params as { contactId: string };
    const schema = z.object({
      leadId: z.string().uuid().optional(),
      type: z.enum(['CALL', 'WHATSAPP', 'EMAIL', 'SMS', 'VISIT', 'TEST_DRIVE', 'NOTE', 'STAGE_CHANGE', 'SYSTEM']),
      direction: z.enum(['IN', 'OUT']).default('OUT'),
      summary: z.string().min(1),
      occurredAt: z.string().datetime().optional(),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);

    const activity = await prisma.activity.create({
      data: {
        contactId,
        leadId: p.data.leadId ?? null,
        type: p.data.type,
        direction: p.data.direction,
        summary: p.data.summary,
        occurredAt: p.data.occurredAt ? new Date(p.data.occurredAt) : new Date(),
        authorId: req.user!.id,
      },
    });
    // Atualiza lastInteractionAt
    await prisma.contact.update({ where: { id: contactId }, data: { lastInteractionAt: new Date() } });
    return rep.status(201).send(activity);
  });

  // ══════════════════════════════════════════════════════════════
  // TASKS
  // ══════════════════════════════════════════════════════════════

  app.get('/admin/tasks/mine', { preValidation: [app.authenticate] }, async (req, rep) => {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user!.id, status: 'OPEN' },
      orderBy: { dueAt: 'asc' },
      include: {
        contact: { select: { name: true, phone: true } },
        lead: { select: { id: true, type: true } },
      },
    });
    return rep.send(tasks);
  });

  app.get('/admin/tasks', { preValidation: [app.authenticate] }, async (req, rep) => {
    const q = req.query as { status?: string; assigneeId?: string; page?: string; pageSize?: string };
    const page = Number(q.page) || 1;
    const pageSize = Math.min(50, Number(q.pageSize) || 20);
    const { skip, take } = toSkipTake(page, pageSize);

    const where: Record<string, unknown> = {};
    if (q.status) where['status'] = q.status;
    // SALES vê só as suas
    if (req.user!.role === 'SALES') {
      where['assigneeId'] = req.user!.id;
    } else if (q.assigneeId) {
      where['assigneeId'] = q.assigneeId;
    }

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { dueAt: 'asc' },
        include: {
          contact: { select: { name: true, phone: true } },
          lead: { select: { id: true, type: true } },
          assignee: { select: { name: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return rep.send({ data: tasks, meta: { total, page, pageSize } });
  });

  app.post('/admin/tasks', { preValidation: [app.authenticate] }, async (req, rep) => {
    const schema = z.object({
      contactId: z.string().uuid(),
      leadId: z.string().uuid().optional(),
      title: z.string().min(1),
      dueAt: z.string().datetime(),
      assigneeId: z.string().uuid().optional(),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);

    const task = await prisma.task.create({
      data: {
        contactId: p.data.contactId,
        leadId: p.data.leadId ?? null,
        title: p.data.title,
        dueAt: new Date(p.data.dueAt),
        assigneeId: p.data.assigneeId ?? req.user!.id,
        status: 'OPEN',
      },
    });
    return rep.status(201).send(task);
  });

  app.patch('/admin/tasks/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    const schema = z.object({
      title: z.string().min(1).optional(),
      dueAt: z.string().datetime().optional(),
      assigneeId: z.string().uuid().optional().nullable(),
      status: z.enum(['OPEN', 'DONE', 'CANCELLED']).optional(),
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return problemFromZod(rep, p.error);

    const data: Record<string, unknown> = { ...p.data };
    if (p.data.dueAt) data['dueAt'] = new Date(p.data.dueAt);
    if (p.data.status === 'DONE') data['completedAt'] = new Date();

    const task = await prisma.task.update({ where: { id }, data });
    return rep.send(task);
  });

  app.delete('/admin/tasks/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    await prisma.task.delete({ where: { id } });
    return rep.status(204).send();
  });

  // ══════════════════════════════════════════════════════════════
  // CRM REPORTS
  // ══════════════════════════════════════════════════════════════

  app.get('/admin/crm/reports', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role === 'SALES') return forbidden(rep);

    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalLeads,
      leadsThisMonth,
      leadsLastMonth,
      wonThisMonth,
      stages,
      byType,
      bySource,
      openTasks,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { createdAt: { gte: firstDayThisMonth } } }),
      prisma.lead.count({ where: { createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth } } }),
      prisma.lead.count({ where: { status: 'WON', updatedAt: { gte: firstDayThisMonth } } }),
      prisma.pipelineStage.findMany({
        orderBy: { position: 'asc' },
        include: { _count: { select: { leads: true } } },
      }),
      prisma.lead.groupBy({ by: ['type'], _count: { id: true } }),
      prisma.lead.groupBy({ by: ['source'], _count: { id: true } }),
      prisma.task.count({ where: { status: 'OPEN' } }),
    ]);

    return rep.send({
      totalLeads,
      leadsThisMonth,
      leadsLastMonth,
      wonThisMonth,
      conversionRate: leadsThisMonth > 0 ? Math.round((wonThisMonth / leadsThisMonth) * 100) : 0,
      openTasks,
      byStage: stages.map((s) => ({ name: s.name, color: s.color, count: s._count.leads })),
      byType: byType.map((r) => ({ type: r.type, count: r._count.id })),
      bySource: bySource.map((r) => ({ source: r.source, count: r._count.id })),
    });
  });
}
