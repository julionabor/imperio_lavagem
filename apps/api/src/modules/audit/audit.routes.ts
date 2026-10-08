import type { FastifyInstance } from 'fastify';
import { prisma } from '../../shared/prisma-client.ts';
import { forbidden } from '../../shared/errors.ts';
import { toSkipTake } from '../../shared/pagination.ts';

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  // GET /admin/audit
  app.get('/admin/audit', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);

    const q = req.query as {
      userId?: string;
      entity?: string;
      page?: string;
      pageSize?: string;
    };

    const page = Number(q.page) || 1;
    const pageSize = Math.min(50, Number(q.pageSize) || 20);
    const { skip, take } = toSkipTake(page, pageSize);

    const where = {
      ...(q.userId ? { userId: q.userId } : {}),
      ...(q.entity ? { entity: q.entity } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return rep.send({ data: items, meta: { total, page, pageSize } });
  });
}
