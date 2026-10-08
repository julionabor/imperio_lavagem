import type { FastifyInstance } from 'fastify';
import * as repo from './settings.repository.ts';
import { forbidden } from '../../shared/errors.ts';
import { auditLog } from '../../shared/audit.ts';

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  // GET /admin/settings
  app.get('/admin/settings', { preValidation: [app.authenticate] }, async (_req, rep) => {
    return rep.send(await repo.getSettings());
  });

  // PUT /admin/settings
  app.put('/admin/settings', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (req.user!.role !== 'ADMIN') return forbidden(rep);
    const updated = await repo.upsertSettings(req.body as Record<string, unknown>);
    await auditLog({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'SiteSettings',
      entityId: updated.id,
      diff: req.body as Record<string, unknown>,
    });
    return rep.send(updated);
  });
}
