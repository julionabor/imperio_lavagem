import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import * as repo from './featured.repository.ts';
import { forbidden, problemFromZod } from '../../shared/errors.ts';
import type { PlacementZone } from '@prisma/client';

export async function featuredRoutes(app: FastifyInstance): Promise<void> {
  // GET /public/featured?placement=HOME_FEATURED
  app.get('/public/featured', async (req, rep) => {
    const q = req.query as { placement?: string };
    const placement = (q.placement ?? 'HOME_FEATURED') as PlacementZone;
    const items = await repo.getFeaturedByPlacement(placement);
    return rep
      .header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      .send(items.map((fp) => ({
        id: fp.id,
        position: fp.position,
        label: fp.label,
        vehicle: fp.vehicle,
      })));
  });

  // GET /admin/featured?placement=
  app.get('/admin/featured', { preValidation: [app.authenticate] }, async (req, rep) => {
    const q = req.query as { placement?: string };
    return rep.send(await repo.listFeaturedAdmin(q.placement as PlacementZone | undefined));
  });

  // PUT /admin/featured/:placement  — substitui a lista inteira
  app.put('/admin/featured/:placement', { preValidation: [app.authenticate] }, async (req, rep) => {
    if (!['ADMIN', 'EDITOR'].includes(req.user!.role)) return forbidden(rep);
    const { placement } = req.params as { placement: string };
    const schema = z.object({ vehicleIds: z.array(z.string().uuid()) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return problemFromZod(rep, parsed.error);

    await repo.setFeaturedPlacement(placement as PlacementZone, parsed.data.vehicleIds);
    return rep.status(204).send();
  });
}
