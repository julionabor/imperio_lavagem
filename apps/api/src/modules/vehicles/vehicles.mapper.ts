/**
 * Converte entidades Prisma em DTOs públicos.
 * Os DTOs públicos NUNCA expõem campos internos (custos, notas, createdById...).
 */
import {
  calcFinancingTaeg,
  calcFinancingTan,
  monthlyRateToImpliedTanBp,
  taegToMonthlyRate,
} from '@pm/libs/finance';
import type { VehicleWithRelations } from './vehicles.repository.ts';
import type { FinancingProduct } from '@prisma/client';
import { FUEL_LABELS, BODY_LABELS } from '@pm/libs/contracts';

export interface PublicVehicleListItem {
  id: string;
  slug: string;
  status: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  mileageKm: number;
  fuel: string;
  fuelLabel: string;
  transmission: string;
  bodyType: string;
  bodyTypeLabel: string;
  powerHp: number | null;
  priceCents: number;
  previousPriceCents: number | null;
  vatDeductible: boolean;
  warrantyMonths: number;
  financingEnabled: boolean;
  monthlyFromCents: number | null;
  coverImage: CoverImageDto | null;
  publishedAt: string | null;
  daysInStock: number;
  isFeatured: boolean;
  badges: string[];
  // budget mode extra fields
  budgetStatus?: 'FITS' | 'NEAR';
  budgetDiffCents?: number;
}

export interface CoverImageDto {
  id: string;
  alt: string;
  variants: { thumb: string; card: string; full: string };
}

export interface PublicVehicleDetail extends PublicVehicleListItem {
  engineCc: number | null;
  doors: number | null;
  seats: number | null;
  batteryKwh: number | null;
  rangeKm: number | null;
  color: string | null;
  colorInterior: string | null;
  description: string | null;
  images: ImageDto[];
  equipment: { category: string; name: string }[];
  seoTitle: string | null;
  seoDescription: string | null;
  viewCount: number;
  financingProductId: string | null;
}

export interface ImageDto {
  id: string;
  alt: string;
  position: number;
  isCover: boolean;
  width: number;
  height: number;
  variants: { thumb: string; card: string; full: string };
}

/** Calcula a prestação mensal "desde" para um veículo. */
export function calcMonthlyFrom(
  priceCents: number,
  product: FinancingProduct | null | undefined,
): number | null {
  if (!product) return null;
  const rate =
    product.rateMode === 'TAEG_INPUT'
      ? taegToMonthlyRate(product.taegBp)
      : product.tanBp / 10_000 / 12;
  const result = calcFinancingTaeg(
    priceCents,
    0, // entrada padrão 0
    product.defaultTermMonths,
    product.taegBp,
  );
  return Math.round(result.monthlyPaymentCents);
}

/** Calcula badges automáticos de uma viatura. */
export function calcBadges(
  vehicle: VehicleWithRelations,
  newBadgeDays: number,
): string[] {
  const badges: string[] = [];
  const now = Date.now();

  if (
    vehicle.publishedAt &&
    now - vehicle.publishedAt.getTime() <= newBadgeDays * 24 * 60 * 60 * 1000
  ) {
    badges.push('NEW');
  }
  if (vehicle.previousPriceCents && vehicle.previousPriceCents > vehicle.priceCents) {
    badges.push('PRICE_DROP');
  }
  if (vehicle.warrantyMonths > 0) {
    badges.push('WARRANTY');
  }
  if (vehicle.featuredPlacements.length > 0) {
    badges.push('FEATURED');
  }
  if (vehicle.status === 'RESERVED') {
    badges.push('RESERVED');
  }
  return badges;
}

export function toPublicListItem(
  vehicle: VehicleWithRelations,
  defaultProduct: FinancingProduct | null,
  newBadgeDays = 3,
): PublicVehicleListItem {
  const product = vehicle.financingProduct ?? defaultProduct;
  const monthlyFromCents = vehicle.financingEnabled ? calcMonthlyFrom(vehicle.priceCents, product) : null;

  const cover = vehicle.images.find((i) => i.isCover) ?? vehicle.images[0] ?? null;

  const publishedAt = vehicle.publishedAt?.toISOString() ?? null;
  const daysInStock = vehicle.publishedAt
    ? Math.floor((Date.now() - vehicle.publishedAt.getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  return {
    id: vehicle.id,
    slug: vehicle.slug,
    status: vehicle.status,
    brand: vehicle.brand.name,
    model: vehicle.model.name,
    version: vehicle.version,
    year: vehicle.registrationDate.getFullYear(),
    mileageKm: vehicle.mileageKm,
    fuel: vehicle.fuel,
    fuelLabel: FUEL_LABELS[vehicle.fuel] ?? vehicle.fuel,
    transmission: vehicle.transmission,
    bodyType: vehicle.bodyType,
    bodyTypeLabel: BODY_LABELS[vehicle.bodyType] ?? vehicle.bodyType,
    powerHp: vehicle.powerHp,
    priceCents: vehicle.priceCents,
    previousPriceCents: vehicle.previousPriceCents,
    vatDeductible: vehicle.vatDeductible,
    warrantyMonths: vehicle.warrantyMonths,
    financingEnabled: vehicle.financingEnabled,
    monthlyFromCents,
    coverImage: cover
      ? { id: cover.id, alt: cover.alt, variants: cover.variants as { thumb: string; card: string; full: string } }
      : null,
    publishedAt,
    daysInStock,
    isFeatured: vehicle.featuredPlacements.length > 0,
    badges: calcBadges(vehicle, newBadgeDays),
  };
}

export function toPublicDetail(
  vehicle: VehicleWithRelations,
  defaultProduct: FinancingProduct | null,
  newBadgeDays = 3,
): PublicVehicleDetail {
  const base = toPublicListItem(vehicle, defaultProduct, newBadgeDays);
  return {
    ...base,
    engineCc: vehicle.engineCc,
    doors: vehicle.doors,
    seats: vehicle.seats,
    batteryKwh: vehicle.batteryKwh,
    rangeKm: vehicle.rangeKm,
    color: vehicle.color,
    colorInterior: vehicle.colorInterior,
    description: vehicle.description,
    images: vehicle.images.map((img) => ({
      id: img.id,
      alt: img.alt,
      position: img.position,
      isCover: img.isCover,
      width: img.width,
      height: img.height,
      variants: img.variants as { thumb: string; card: string; full: string },
    })),
    equipment: [],
    seoTitle: vehicle.seoTitle,
    seoDescription: vehicle.seoDescription,
    viewCount: vehicle.viewCount,
    financingProductId: vehicle.financingProductId,
  };
}

/** DTO para o admin (inclui campos internos). */
export function toAdminVehicle(vehicle: VehicleWithRelations): Record<string, unknown> {
  return {
    id: vehicle.id,
    slug: vehicle.slug,
    status: vehicle.status,
    condition: vehicle.condition,
    brandId: vehicle.brandId,
    modelId: vehicle.modelId,
    brand: vehicle.brand.name,
    model: vehicle.model.name,
    version: vehicle.version,
    registrationDate: vehicle.registrationDate.toISOString(),
    year: vehicle.registrationDate.getFullYear(),
    mileageKm: vehicle.mileageKm,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    bodyType: vehicle.bodyType,
    powerHp: vehicle.powerHp,
    engineCc: vehicle.engineCc,
    doors: vehicle.doors,
    seats: vehicle.seats,
    batteryKwh: vehicle.batteryKwh,
    rangeKm: vehicle.rangeKm,
    color: vehicle.color,
    colorInterior: vehicle.colorInterior,
    priceCents: vehicle.priceCents,
    previousPriceCents: vehicle.previousPriceCents,
    vatDeductible: vehicle.vatDeductible,
    warrantyMonths: vehicle.warrantyMonths,
    description: vehicle.description,
    financingEnabled: vehicle.financingEnabled,
    financingProductId: vehicle.financingProductId,
    seoTitle: vehicle.seoTitle,
    seoDescription: vehicle.seoDescription,
    publishedAt: vehicle.publishedAt?.toISOString() ?? null,
    reservedAt: vehicle.reservedAt?.toISOString() ?? null,
    soldAt: vehicle.soldAt?.toISOString() ?? null,
    viewCount: vehicle.viewCount,
    favoriteCount: vehicle.favoriteCount,
    images: vehicle.images.map((img) => ({
      id: img.id,
      position: img.position,
      isCover: img.isCover,
      alt: img.alt,
      variants: img.variants,
    })),
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };
}
