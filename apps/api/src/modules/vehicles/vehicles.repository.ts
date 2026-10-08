import { prisma } from '../../shared/prisma-client.ts';
import type {
  Vehicle,
  VehicleStatus,
  Fuel,
  Transmission,
  BodyType,
  VehicleCondition,
  Prisma,
} from '@prisma/client';
import { toSkipTake } from '../../shared/pagination.ts';

// ── Tipos de query ────────────────────────────────────────────────────────

export interface VehicleListFilter {
  brand?: string;
  model?: string;
  priceMax?: number;
  yearMin?: number;
  kmMax?: number;
  fuel?: string[];
  transmission?: string[];
  bodyType?: string[];
  status?: VehicleStatus[];
  // admin only
  withoutImages?: boolean;
}

export type VehicleSortKey = 'NEWEST' | 'PRICE_ASC' | 'MONTHLY_ASC' | 'KM_ASC';

/** Inclui todas as relações necessárias para o mapper. */
const vehicleInclude = {
  brand: { select: { name: true } },
  model: { select: { name: true } },
  images: {
    orderBy: { position: 'asc' as const },
    select: {
      id: true,
      storageKey: true,
      variants: true,
      alt: true,
      position: true,
      isCover: true,
      width: true,
      height: true,
    },
  },
  financingProduct: true,
  featuredPlacements: {
    where: {
      active: true,
      placement: 'HOME_FEATURED' as const,
      OR: [
        { endsAt: null },
        { endsAt: { gt: new Date() } },
      ],
    },
    select: { id: true },
  },
} satisfies Prisma.VehicleInclude;

export type VehicleWithRelations = Prisma.VehicleGetPayload<{
  include: typeof vehicleInclude;
}>;

function buildWhere(filter: VehicleListFilter): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {};

  if (filter.brand) {
    where.brand = { slug: filter.brand };
  }
  if (filter.model) {
    where.model = { slug: filter.model };
  }
  if (filter.priceMax !== undefined) {
    where.priceCents = { lte: filter.priceMax };
  }
  if (filter.yearMin !== undefined) {
    where.registrationDate = {
      gte: new Date(filter.yearMin, 0, 1),
    };
  }
  if (filter.kmMax !== undefined) {
    where.mileageKm = { lte: filter.kmMax };
  }
  if (filter.fuel?.length) {
    where.fuel = { in: filter.fuel as Fuel[] };
  }
  if (filter.transmission?.length) {
    where.transmission = { in: filter.transmission as Transmission[] };
  }
  if (filter.bodyType?.length) {
    where.bodyType = { in: filter.bodyType as BodyType[] };
  }
  if (filter.status?.length) {
    where.status = { in: filter.status };
  }
  if (filter.withoutImages) {
    where.images = { none: {} };
  }

  return where;
}

function buildOrderBy(sort: VehicleSortKey): Prisma.VehicleOrderByWithRelationInput {
  switch (sort) {
    case 'PRICE_ASC': return { priceCents: 'asc' };
    case 'KM_ASC':    return { mileageKm: 'asc' };
    case 'NEWEST':
    default:          return { publishedAt: 'desc' };
  }
}

// ── Listagem pública ──────────────────────────────────────────────────────

export async function listPublicVehicles(
  filter: VehicleListFilter,
  sort: VehicleSortKey,
  page: number,
  pageSize: number,
): Promise<{ items: VehicleWithRelations[]; total: number }> {
  const where: Prisma.VehicleWhereInput = {
    ...buildWhere(filter),
    status: { in: ['PUBLISHED', 'RESERVED'] },
  };
  const orderBy = buildOrderBy(sort);
  const { skip, take } = toSkipTake(page, pageSize);

  const [items, total] = await prisma.$transaction([
    prisma.vehicle.findMany({ where, orderBy, skip, take, include: vehicleInclude }),
    prisma.vehicle.count({ where }),
  ]);

  return { items, total };
}

/** Facetas: conta viaturas por fuel e bodyType para os filtros do UI. */
export async function getVehicleFacets(
  filter: VehicleListFilter,
): Promise<{ fuel: Record<string, number>; body: Record<string, number> }> {
  const baseWhere: Prisma.VehicleWhereInput = {
    ...buildWhere({ ...filter, fuel: undefined, bodyType: undefined }),
    status: { in: ['PUBLISHED', 'RESERVED'] },
  };

  const [fuels, bodies] = await Promise.all([
    prisma.vehicle.groupBy({
      by: ['fuel'],
      where: { ...baseWhere, ...(filter.bodyType?.length ? { bodyType: { in: filter.bodyType as BodyType[] } } : {}) },
      _count: { fuel: true },
      orderBy: { fuel: 'asc' },
    }),
    prisma.vehicle.groupBy({
      by: ['bodyType'],
      where: { ...baseWhere, ...(filter.fuel?.length ? { fuel: { in: filter.fuel as Fuel[] } } : {}) },
      _count: { bodyType: true },
      orderBy: { bodyType: 'asc' },
    }),
  ]);

  return {
    fuel: Object.fromEntries(fuels.map((f) => [f.fuel, (f._count as Record<string, number>)['fuel'] ?? 0])),
    body: Object.fromEntries(bodies.map((b) => [b.bodyType, (b._count as Record<string, number>)['bodyType'] ?? 0])),
  };
}

/** Conta viaturas por filtro (para sugestões do estado vazio). */
export async function countWithFilter(filter: VehicleListFilter): Promise<number> {
  const where: Prisma.VehicleWhereInput = {
    ...buildWhere(filter),
    status: { in: ['PUBLISHED', 'RESERVED'] },
  };
  return prisma.vehicle.count({ where });
}

// ── Detalhe público ───────────────────────────────────────────────────────

export async function findVehicleBySlug(slug: string): Promise<VehicleWithRelations | null> {
  return prisma.vehicle.findUnique({
    where: { slug },
    include: vehicleInclude,
  });
}

export async function findSimilarVehicles(
  vehicleId: string,
  bodyType: BodyType,
  priceCents: number,
): Promise<VehicleWithRelations[]> {
  return prisma.vehicle.findMany({
    where: {
      id: { not: vehicleId },
      status: { in: ['PUBLISHED', 'RESERVED'] },
      bodyType,
      priceCents: {
        gte: Math.floor(priceCents * 0.8),
        lte: Math.ceil(priceCents * 1.2),
      },
    },
    orderBy: [{ priceCents: 'asc' }],
    take: 8,
    include: vehicleInclude,
  });
}

export async function incrementViewCount(id: string): Promise<void> {
  await prisma.vehicle.update({ where: { id }, data: { viewCount: { increment: 1 } } });
}

export async function incrementFavoriteCount(id: string, delta: 1 | -1): Promise<void> {
  await prisma.vehicle.update({
    where: { id },
    data: { favoriteCount: { increment: delta } },
  });
}

// ── Admin CRUD ────────────────────────────────────────────────────────────

export interface CreateVehicleData {
  slug: string;
  brandId: string;
  modelId: string;
  version: string;
  condition: VehicleCondition;
  registrationDate: Date;
  mileageKm: number;
  fuel: Fuel;
  transmission: Transmission;
  bodyType: BodyType;
  priceCents: number;
  previousPriceCents?: number;
  vatDeductible?: boolean;
  warrantyMonths?: number;
  powerHp?: number;
  engineCc?: number;
  doors?: number;
  seats?: number;
  batteryKwh?: number;
  rangeKm?: number;
  color?: string;
  colorInterior?: string;
  description?: string;
  financingEnabled?: boolean;
  financingProductId?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdById: string;
}

export async function createVehicle(data: CreateVehicleData): Promise<VehicleWithRelations> {
  return prisma.vehicle.create({
    data: {
      ...data,
      updatedById: data.createdById,
    },
    include: vehicleInclude,
  });
}

export async function updateVehicle(
  id: string,
  data: Partial<Omit<CreateVehicleData, 'createdById'>> & { updatedById: string },
): Promise<VehicleWithRelations> {
  return prisma.vehicle.update({
    where: { id },
    data,
    include: vehicleInclude,
  });
}

export async function changeVehicleStatus(
  id: string,
  status: VehicleStatus,
  userId: string,
): Promise<VehicleWithRelations> {
  const now = new Date();
  const timestamps: Partial<Vehicle> = {};
  if (status === 'PUBLISHED') timestamps.publishedAt = now;
  if (status === 'RESERVED') timestamps.reservedAt = now;
  if (status === 'SOLD') timestamps.soldAt = now;

  return prisma.vehicle.update({
    where: { id },
    data: { status, ...timestamps, updatedById: userId },
    include: vehicleInclude,
  });
}

export async function findVehicleById(id: string): Promise<VehicleWithRelations | null> {
  return prisma.vehicle.findUnique({ where: { id }, include: vehicleInclude });
}

export async function listAdminVehicles(
  filter: VehicleListFilter,
  sort: VehicleSortKey,
  page: number,
  pageSize: number,
): Promise<{ items: VehicleWithRelations[]; total: number }> {
  const where = buildWhere(filter);
  const orderBy = buildOrderBy(sort);
  const { skip, take } = toSkipTake(page, pageSize);

  const [items, total] = await prisma.$transaction([
    prisma.vehicle.findMany({ where, orderBy, skip, take, include: vehicleInclude }),
    prisma.vehicle.count({ where }),
  ]);

  return { items, total };
}

export async function findSlugStartsWith(prefix: string): Promise<string[]> {
  const rows = await prisma.vehicle.findMany({
    where: { slug: { startsWith: prefix } },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getDefaultFinancingProduct() {
  return prisma.financingProduct.findFirst({
    where: { isDefault: true, active: true },
  });
}
