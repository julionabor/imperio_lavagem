import type { FastifyInstance } from 'fastify';
import { prisma } from '../../shared/prisma-client.ts';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  // GET /admin/dashboard/summary
  app.get('/admin/dashboard/summary', { preValidation: [app.authenticate] }, async (_req, rep) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      publishedCount,
      reservedCount,
      soldThisMonth,
      newLeadsToday,
      newLeadsWeek,
      mostViewed,
      oldWithoutLeads,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { status: 'PUBLISHED' } }),
      prisma.vehicle.count({ where: { status: 'RESERVED' } }),
      prisma.vehicle.count({ where: { status: 'SOLD', soldAt: { gte: startOfMonth } } }),
      prisma.lead.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.vehicle.findMany({
        where: { status: { in: ['PUBLISHED', 'RESERVED'] } },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { id: true, slug: true, viewCount: true, brand: { select: { name: true } }, model: { select: { name: true } }, version: true },
      }),
      prisma.vehicle.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { lt: ninetyDaysAgo },
          leads: { none: {} },
        },
        orderBy: { publishedAt: 'asc' },
        take: 5,
        select: { id: true, slug: true, publishedAt: true, brand: { select: { name: true } }, model: { select: { name: true } }, version: true },
      }),
    ]);

    return rep.send({
      vehicles: { published: publishedCount, reserved: reservedCount, soldThisMonth },
      leads: { today: newLeadsToday, lastSevenDays: newLeadsWeek },
      mostViewed,
      oldWithoutLeads,
    });
  });
}
