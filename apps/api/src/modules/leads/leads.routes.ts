import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { CreateLeadSchema } from '@pm/libs/contracts';
import * as repo from './leads.repository.ts';
import { problemFromZod, notFound, forbidden } from '../../shared/errors.ts';
import { prisma } from '../../shared/prisma-client.ts';
import {
  sendNewLeadNotification,
  sendLeadConfirmation,
} from '../../shared/mailer.ts';
import { toSkipTake } from '../../shared/pagination.ts';

export async function leadsRoutes(app: FastifyInstance): Promise<void> {
  // POST /public/leads — rate limitado, com honeypot
  app.post('/public/leads', {
    config: { rateLimit: { max: process.env['NODE_ENV'] === 'test' ? 1000 : 5, timeWindow: '1 hour', keyGenerator: (req) => req.ip } },
  }, async (req, rep) => {
    const parsed = CreateLeadSchema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    // Honeypot
    if (parsed.data.website) {
      // Bot detetado — fingir sucesso sem criar nada
      return rep.status(201).send({ leadId: 'bot', contactId: 'bot', message: 'Pedido recebido.' });
    }

    // Resolve vehicleId a partir do slug, se fornecido
    let vehicleId: string | undefined;
    if (parsed.data.vehicleSlug) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { slug: parsed.data.vehicleSlug },
        select: { id: true },
      });
      vehicleId = vehicle?.id;
    }

    const { leadId, contactId } = await repo.createLeadTransaction({
      type: parsed.data.type,
      source: parsed.data.source,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      preferredContact: parsed.data.preferredContact as never,
      preferredDate: parsed.data.preferredDate ? new Date(parsed.data.preferredDate) : undefined,
      message: parsed.data.message,
      vehicleId,
      searchSnapshot: parsed.data.searchSnapshot,
      simulationSnapshot: parsed.data.simulationSnapshot,
      assistantAnswers: parsed.data.assistantAnswers,
      utm: parsed.data.utm,
      consentPrivacy: parsed.data.consentPrivacy,
      consentMarketing: parsed.data.consentMarketing,
    });

    // Notificações em paralelo (não bloqueiam a resposta)
    const settings = await prisma.siteSettings.findFirst({ select: { email: true } });
    const standEmail = settings?.email;

    if (standEmail) {
      sendNewLeadNotification({
        leadId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || undefined,
        type: parsed.data.type,
        standEmail,
      }).catch(() => undefined);
    }

    if (parsed.data.email) {
      sendLeadConfirmation({
        name: parsed.data.name,
        email: parsed.data.email,
        type: parsed.data.type,
      }).catch(() => undefined);
    }

    return rep.status(201).send({
      leadId,
      contactId,
      message: 'Pedido recebido com sucesso. Entraremos em contacto brevemente.',
    });
  });

  // ── Admin — Leads ──────────────────────────────────────────────────────

  // GET /admin/leads
  app.get('/admin/leads', { preValidation: [app.authenticate] }, async (req, rep) => {
    const user = req.user!;
    const q = req.query as {
      status?: string;
      type?: string;
      assignedToId?: string;
      page?: string;
      pageSize?: string;
    };

    const page = Number(q.page) || 1;
    const pageSize = Math.min(50, Number(q.pageSize) || 20);
    const { skip, take } = toSkipTake(page, pageSize);

    const where: Record<string, unknown> = {};
    if (q.status) where['status'] = q.status;
    if (q.type) where['type'] = q.type;

    // SALES vê apenas os seus leads + não atribuídos
    if (user.role === 'SALES') {
      where['OR'] = [{ assignedToId: user.id }, { assignedToId: null }];
    } else if (q.assignedToId) {
      where['assignedToId'] = q.assignedToId;
    }

    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          contact: { select: { name: true, phone: true, email: true } },
          vehicle: { select: { slug: true, brand: { select: { name: true } }, model: { select: { name: true } } } },
          assignedTo: { select: { name: true } },
          stage: { select: { name: true, color: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return rep.send({ data: leads, meta: { total, page, pageSize } });
  });

  // GET /admin/leads/:id
  app.get('/admin/leads/:id', { preValidation: [app.authenticate] }, async (req, rep) => {
    const user = req.user!;
    const { id } = req.params as { id: string };

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        contact: true,
        vehicle: { select: { slug: true, brand: { select: { name: true } }, model: { select: { name: true } }, version: true } },
        tradeIn: true,
        assignedTo: { select: { id: true, name: true } },
        stage: true,
        activities: { orderBy: { occurredAt: 'desc' } },
        tasks: { orderBy: { dueAt: 'asc' } },
      },
    });
    if (!lead) return notFound(rep);

    // SALES só vê os seus leads
    if (user.role === 'SALES' && lead.assignedToId !== user.id && lead.assignedToId !== null) {
      return forbidden(rep);
    }

    return rep.send(lead);
  });

  // PATCH /admin/leads/:id/status
  app.patch('/admin/leads/:id/status', { preValidation: [app.authenticate] }, async (req, rep) => {
    const { id } = req.params as { id: string };
    const schema = z.object({ stageId: z.string().uuid().optional(), status: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    const updated = await prisma.lead.update({
      where: { id },
      data: { ...(parsed.data.stageId ? { stageId: parsed.data.stageId } : {}) },
    });
    return rep.send(updated);
  });

  // PATCH /admin/leads/:id/assign
  app.patch('/admin/leads/:id/assign', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!['ADMIN', 'EDITOR'].includes(req.user!.role)) return forbidden(rep);
    const { id } = req.params as { id: string };
    const schema = z.object({ assignedToId: z.string().uuid().nullable() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    const updated = await prisma.lead.update({
      where: { id },
      data: { assignedToId: parsed.data.assignedToId },
    });
    return rep.send(updated);
  });
}
