import { z } from 'zod';
import * as repo from './vehicles.repository.ts';
import * as mapper from './vehicles.mapper.ts';
import { toPublicListItem, calcMonthlyFrom } from './vehicles.mapper.ts';
import { vehicleSlug, uniqueSlug } from '../../shared/slug.ts';
import { prisma } from '../../shared/prisma-client.ts';
import type { VehicleListFilter, VehicleSortKey } from './vehicles.repository.ts';
export type { VehicleSortKey };
import type { FinancingProduct } from '@prisma/client';

// ── Listagem pública ──────────────────────────────────────────────────────

export interface ListQuery {
  brand?: string;
  model?: string;
  priceMax?: number;
  yearMin?: number;
  kmMax?: number;
  fuel?: string | string[];
  transmission?: string | string[];
  bodyType?: string | string[];
  sort?: VehicleSortKey;
  page?: number;
  pageSize?: number;
  // modo orçamento
  budget?: number;   // prestação máxima em cêntimos
  down?: number;     // entrada em cêntimos
  term?: number;     // prazo em meses
}

function toArray(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v : v.split(',').map((s) => s.trim());
}

export async function listVehicles(query: ListQuery) {
  const filter: VehicleListFilter = {
    brand: query.brand,
    model: query.model,
    priceMax: query.priceMax,
    yearMin: query.yearMin,
    kmMax: query.kmMax,
    fuel: toArray(query.fuel),
    transmission: toArray(query.transmission),
    bodyType: toArray(query.bodyType),
  };

  const sort = query.sort ?? 'NEWEST';
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 9));

  // Produto padrão para calcular prestações
  const defaultProduct = await repo.getDefaultFinancingProduct();

  const [{ items, total }, facets] = await Promise.all([
    repo.listPublicVehicles(filter, sort, page, pageSize),
    repo.getVehicleFacets(filter),
  ]);

  const settings = await prisma.siteSettings.findFirst({ select: { newBadgeDays: true } });
  const newBadgeDays = settings?.newBadgeDays ?? 3;

  let mappedItems = items.map((v) => mapper.toPublicListItem(v, defaultProduct, newBadgeDays));

  // Modo orçamento: adiciona budgetStatus e diff
  if (query.budget) {
    const { budget, down = 0, term } = query;
    const product = defaultProduct;
    const termMonths = term ?? product?.defaultTermMonths ?? 96;

    mappedItems = mappedItems.map((item) => {
      if (!item.financingEnabled || !product) return item;
      const monthly = mapper.calcMonthlyFrom(item.priceCents - down, product);
      if (monthly === null) return item;
      const nearThreshold = budget * (1 + (product.budgetNearPct ?? 15) / 100);
      if (monthly <= budget) {
        return { ...item, budgetStatus: 'FITS' as const, budgetDiffCents: budget - monthly };
      } else if (monthly <= nearThreshold) {
        return { ...item, budgetStatus: 'NEAR' as const, budgetDiffCents: monthly - budget };
      }
      return item;
    });

    // No modo orçamento: mostrar primeiro FITS, depois NEAR, resto oculto
    mappedItems = [
      ...mappedItems.filter((i) => i.budgetStatus === 'FITS'),
      ...mappedItems.filter((i) => i.budgetStatus === 'NEAR'),
    ];
  }

  return {
    data: mappedItems,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      fitsCount: mappedItems.filter((i) => i.budgetStatus === 'FITS').length,
      nearCount: mappedItems.filter((i) => i.budgetStatus === 'NEAR').length,
    },
    facets,
  };
}

// ── Sugestões do estado vazio ─────────────────────────────────────────────

export async function getVehicleSuggestions(activeFilter: VehicleListFilter) {
  const suggestions: Array<{ type: string; label: string; count: number; filter: VehicleListFilter }> = [];

  const tryRelax = async (label: string, relaxed: VehicleListFilter) => {
    const count = await repo.countWithFilter(relaxed);
    if (count > 0) suggestions.push({ type: 'relax', label, count, filter: relaxed });
  };

  // Tenta remover cada filtro ativo
  if (activeFilter.fuel?.length) {
    await tryRelax(
      `Remover combustível (${activeFilter.fuel.join(', ')})`,
      { ...activeFilter, fuel: undefined },
    );
  }
  if (activeFilter.bodyType?.length) {
    await tryRelax(
      `Remover carroçaria (${activeFilter.bodyType.join(', ')})`,
      { ...activeFilter, bodyType: undefined },
    );
  }
  if (activeFilter.priceMax) {
    const increased = Math.round(activeFilter.priceMax * 1.2);
    await tryRelax(
      `Aumentar preço máximo para ${(increased / 100).toLocaleString('pt-PT')} €`,
      { ...activeFilter, priceMax: increased },
    );
  }
  if (activeFilter.yearMin) {
    await tryRelax(
      `Alargar ano (a partir de ${activeFilter.yearMin - 2})`,
      { ...activeFilter, yearMin: activeFilter.yearMin - 2 },
    );
  }
  if (activeFilter.kmMax) {
    const increased = Math.round(activeFilter.kmMax * 1.5);
    await tryRelax(
      `Aumentar km máximos para ${increased.toLocaleString('pt-PT')} km`,
      { ...activeFilter, kmMax: increased },
    );
  }

  // Devolve as 3 sugestões com mais resultados
  return suggestions.sort((a, b) => b.count - a.count).slice(0, 3);
}

// ── Detalhe ───────────────────────────────────────────────────────────────

export async function getVehicleBySlug(slug: string) {
  const vehicle = await repo.findVehicleBySlug(slug);
  if (!vehicle) return null;
  const defaultProduct = await repo.getDefaultFinancingProduct();
  const settings = await prisma.siteSettings.findFirst({ select: { newBadgeDays: true } });
  return {
    vehicle,
    dto: mapper.toPublicDetail(vehicle, defaultProduct, settings?.newBadgeDays ?? 3),
  };
}

export async function getSimilarVehicles(vehicleId: string, bodyType: string, priceCents: number) {
  const vehicles = await repo.findSimilarVehicles(vehicleId, bodyType as never, priceCents);
  const defaultProduct = await repo.getDefaultFinancingProduct();
  const settings = await prisma.siteSettings.findFirst({ select: { newBadgeDays: true } });
  return vehicles.map((v) => mapper.toPublicListItem(v, defaultProduct, settings?.newBadgeDays ?? 3));
}

// ── Admin ─────────────────────────────────────────────────────────────────

const CreateVehicleSchema = z.object({
  brandId: z.string().uuid(),
  modelId: z.string().uuid(),
  version: z.string().min(1).max(120),
  condition: z.enum(['NEW', 'USED', 'NEARLY_NEW']),
  registrationYear: z.number().int().min(1960).max(new Date().getFullYear()),
  registrationMonth: z.number().int().min(1).max(12).default(1),
  mileageKm: z.number().int().min(0),
  fuel: z.enum(['PETROL', 'DIESEL', 'HYBRID', 'PHEV', 'ELECTRIC', 'LPG']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  bodyType: z.enum(['SUV', 'ESTATE', 'SEDAN', 'CITY', 'COUPE', 'CABRIO', 'MPV', 'VAN']),
  priceCents: z.number().int().positive(),
  previousPriceCents: z.number().int().optional(),
  vatDeductible: z.boolean().optional(),
  warrantyMonths: z.number().int().min(0).optional(),
  powerHp: z.number().int().optional(),
  engineCc: z.number().int().optional(),
  doors: z.number().int().optional(),
  seats: z.number().int().optional(),
  batteryKwh: z.number().int().optional(),
  rangeKm: z.number().int().optional(),
  color: z.string().optional(),
  colorInterior: z.string().optional(),
  description: z.string().max(5000).optional(),
  financingEnabled: z.boolean().optional(),
  financingProductId: z.string().uuid().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;

export { CreateVehicleSchema };

export async function createVehicle(data: CreateVehicleInput, userId: string) {
  // Busca brand e model para gerar o slug
  const brand = await prisma.brand.findUnique({ where: { id: data.brandId } });
  const model = await prisma.model.findUnique({ where: { id: data.modelId } });
  if (!brand || !model) throw new Error('Marca ou modelo não encontrado.');

  const baseSlug = vehicleSlug(brand.name, model.name, data.version, data.registrationYear);
  const existingSlugs = await repo.findSlugStartsWith(baseSlug);
  const slug = uniqueSlug(baseSlug, existingSlugs);

  const vehicle = await repo.createVehicle({
    slug,
    brandId: data.brandId,
    modelId: data.modelId,
    version: data.version,
    condition: data.condition,
    registrationDate: new Date(data.registrationYear, (data.registrationMonth ?? 1) - 1, 1),
    mileageKm: data.mileageKm,
    fuel: data.fuel,
    transmission: data.transmission,
    bodyType: data.bodyType,
    priceCents: data.priceCents,
    previousPriceCents: data.previousPriceCents,
    vatDeductible: data.vatDeductible,
    warrantyMonths: data.warrantyMonths,
    powerHp: data.powerHp,
    engineCc: data.engineCc,
    doors: data.doors,
    seats: data.seats,
    batteryKwh: data.batteryKwh,
    rangeKm: data.rangeKm,
    color: data.color,
    colorInterior: data.colorInterior,
    description: data.description,
    financingEnabled: data.financingEnabled,
    financingProductId: data.financingProductId,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    createdById: userId,
  });

  return mapper.toAdminVehicle(vehicle);
}

export async function duplicateVehicle(vehicleId: string, userId: string) {
  const original = await repo.findVehicleById(vehicleId);
  if (!original) return null;

  const baseSlug = `${original.slug}-copia`;
  const existingSlugs = await repo.findSlugStartsWith(baseSlug);
  const slug = uniqueSlug(baseSlug, existingSlugs);

  const vehicle = await repo.createVehicle({
    slug,
    brandId: original.brandId,
    modelId: original.modelId,
    version: original.version + ' (cópia)',
    condition: original.condition,
    registrationDate: original.registrationDate,
    mileageKm: original.mileageKm,
    fuel: original.fuel,
    transmission: original.transmission,
    bodyType: original.bodyType,
    priceCents: original.priceCents,
    previousPriceCents: original.previousPriceCents ?? undefined,
    vatDeductible: original.vatDeductible,
    warrantyMonths: original.warrantyMonths,
    powerHp: original.powerHp ?? undefined,
    engineCc: original.engineCc ?? undefined,
    doors: original.doors ?? undefined,
    seats: original.seats ?? undefined,
    batteryKwh: original.batteryKwh ?? undefined,
    rangeKm: original.rangeKm ?? undefined,
    color: original.color ?? undefined,
    colorInterior: original.colorInterior ?? undefined,
    description: original.description ?? undefined,
    financingEnabled: original.financingEnabled,
    financingProductId: original.financingProductId ?? undefined,
    seoTitle: original.seoTitle ?? undefined,
    seoDescription: original.seoDescription ?? undefined,
    createdById: userId,
  });

  return mapper.toAdminVehicle(vehicle);
}
