import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import * as repo from './featured.repository.ts';
import { forbidden, problemFromZod } from '../../shared/errors.ts';
import { calcMonthlyFrom } from '../vehicles/vehicles.mapper.ts';
import { FUEL_LABELS, BODY_LABELS } from '@pm/libs/contracts';
import type { PlacementZone } from '@prisma/client';

export async function featuredRoutes(app: FastifyInstance): Promise<void> {
  // GET /public/featured?placement=HOME_FEATURED
  app.get('/public/featured', async (req, rep) => {
    const q = req.query as { placement?: string };
    const placement = (q.placement ?? 'HOME_FEATURED') as PlacementZone;
    const items = await repo.getFeaturedByPlacement(placement);
    return rep
      .header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      .send(items.map((fp) => {
        const v = fp.vehicle;
        const product = v.financingProduct ?? null;
        const monthlyFromCents = v.financingEnabled ? calcMonthlyFrom(v.priceCents, product) : null;
        const cover = v.images[0] ?? null;
        const daysInStock = v.publishedAt
          ? Math.floor((Date.now() - v.publishedAt.getTime()) / (24 * 60 * 60 * 1000))
          : 0;
        return {
          id: v.id,
          slug: v.slug,
          status: v.status,
          brand: v.brand.name,
          model: v.model.name,
          version: v.version,
          year: v.registrationDate.getFullYear(),
          mileageKm: v.mileageKm,
          fuel: v.fuel,
          fuelLabel: FUEL_LABELS[v.fuel as keyof typeof FUEL_LABELS] ?? v.fuel,
          transmission: v.transmission,
          bodyType: v.bodyType,
          bodyTypeLabel: BODY_LABELS[v.bodyType as keyof typeof BODY_LABELS] ?? v.bodyType,
          powerHp: v.powerHp,
          priceCents: v.priceCents,
          previousPriceCents: v.previousPriceCents,
          vatDeductible: v.vatDeductible,
          warrantyMonths: v.warrantyMonths,
          financingEnabled: v.financingEnabled,
          monthlyFromCents,
          coverImage: cover
            ? { id: cover.id, alt: cover.alt, variants: cover.variants as { thumb: string; card: string; full: string } }
            : null,
          publishedAt: v.publishedAt?.toISOString() ?? null,
          daysInStock,
          isFeatured: true,
          badges: ['FEATURED'],
          label: fp.label,
        };
      }));
  });

  // GET /admin/featured?placement=
  app.get('/admin/featured', { preValidation: [app.authenticate] }, async (req, rep) => {
    const q = req.query as { placement?: string };
    const items = await repo.listFeaturedAdmin(q.placement as PlacementZone | undefined);
    return rep.send(items.map((fp) => ({
      id: fp.id,
      position: fp.position,
      label: fp.label,
      vehicle: {
        id: fp.vehicle.id,
        slug: fp.vehicle.slug,
        status: fp.vehicle.status,
        brand: fp.vehicle.brand,
        model: fp.vehicle.model,
        version: fp.vehicle.version,
        year: fp.vehicle.registrationDate.getFullYear(),
        priceCents: fp.vehicle.priceCents,
        coverImage: fp.vehicle.images[0]
          ? { variants: fp.vehicle.images[0].variants as { thumb: string; card: string; full: string } }
          : null,
      },
    })));
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
