import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────────────────────

export const VehicleStatus = z.enum(['DRAFT', 'PUBLISHED', 'RESERVED', 'SOLD', 'ARCHIVED']);
export type VehicleStatus = z.infer<typeof VehicleStatus>;

export const VehicleCondition = z.enum(['NEW', 'USED', 'NEARLY_NEW']);
export type VehicleCondition = z.infer<typeof VehicleCondition>;

export const Fuel = z.enum(['PETROL', 'DIESEL', 'HYBRID', 'PHEV', 'ELECTRIC', 'LPG']);
export type Fuel = z.infer<typeof Fuel>;

export const Transmission = z.enum(['MANUAL', 'AUTOMATIC']);
export type Transmission = z.infer<typeof Transmission>;

export const BodyType = z.enum(['SUV', 'ESTATE', 'SEDAN', 'CITY', 'COUPE', 'CABRIO', 'MPV', 'VAN']);
export type BodyType = z.infer<typeof BodyType>;

// ── Display labels (used by search-parser; match prototype values) ──────────

export const FUEL_LABELS: Record<Fuel, string> = {
  PETROL: 'Gasolina',
  DIESEL: 'Diesel',
  HYBRID: 'Híbrido',
  PHEV: 'Plug-in',
  ELECTRIC: 'Elétrico',
  LPG: 'GPL',
};

export const BODY_LABELS: Record<BodyType, string> = {
  SUV: 'SUV',
  ESTATE: 'Carrinha',
  SEDAN: 'Berlina',
  CITY: 'Utilitário',
  COUPE: 'Coupé',
  CABRIO: 'Cabrio',
  MPV: 'Monovolume',
  VAN: 'Comercial',
};

// ── FilterState — output of parse(), synced with URL query params ──────────

export const FilterStateSchema = z.object({
  brand: z.string(),
  model: z.string(),
  /** Preço máximo em cêntimos */
  priceMax: z.number().int().nullable(),
  /** Prestação máxima em cêntimos */
  monthlyMax: z.number().int().nullable(),
  yearMin: z.number().int().nullable(),
  kmMax: z.number().int().nullable(),
  /** Valores são os labels do protótipo: 'Diesel', 'Gasolina', 'Híbrido', 'Plug-in', 'Elétrico' */
  fuel: z.array(z.string()),
  gear: z.string(),
  /** Valores são os labels do protótipo: 'SUV', 'Carrinha', 'Berlina', 'Utilitário', 'Coupé' */
  body: z.array(z.string()),
});
export type FilterState = z.infer<typeof FilterStateSchema>;

// ── Vehicle (DTO público) ──────────────────────────────────────────────────

export const VehicleImageSchema = z.object({
  id: z.string().uuid(),
  storageKey: z.string(),
  alt: z.string(),
  position: z.number().int(),
  isCover: z.boolean(),
  width: z.number().int(),
  height: z.number().int(),
  variants: z.object({
    thumb: z.string(),
    card: z.string(),
    full: z.string(),
  }),
});
export type VehicleImage = z.infer<typeof VehicleImageSchema>;

export const VehicleListItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  status: VehicleStatus,
  condition: VehicleCondition,
  brand: z.string(),
  model: z.string(),
  version: z.string(),
  year: z.number().int(),
  mileageKm: z.number().int(),
  fuel: Fuel,
  transmission: Transmission,
  bodyType: BodyType,
  powerHp: z.number().int().nullable(),
  /** Preço de venda em cêntimos */
  priceCents: z.number().int(),
  /** Preço anterior em cêntimos (badge "Baixa de preço") */
  previousPriceCents: z.number().int().nullable(),
  vatDeductible: z.boolean(),
  warrantyMonths: z.number().int(),
  financingEnabled: z.boolean(),
  coverImage: VehicleImageSchema.nullable(),
  publishedAt: z.string().datetime().nullable(),
  daysInStock: z.number().int(),
  isFeatured: z.boolean(),
});
export type VehicleListItem = z.infer<typeof VehicleListItemSchema>;

export const VehicleDetailSchema = VehicleListItemSchema.extend({
  engineCc: z.number().int().nullable(),
  doors: z.number().int().nullable(),
  seats: z.number().int().nullable(),
  batteryKwh: z.number().int().nullable(),
  rangeKm: z.number().int().nullable(),
  color: z.string().nullable(),
  colorInterior: z.string().nullable(),
  description: z.string().nullable(),
  images: z.array(VehicleImageSchema),
  equipment: z.array(
    z.object({
      category: z.string(),
      name: z.string(),
    }),
  ),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  viewCount: z.number().int(),
  financingProductId: z.string().uuid().nullable(),
});
export type VehicleDetail = z.infer<typeof VehicleDetailSchema>;

// ── Search / list query ────────────────────────────────────────────────────

export const VehicleSort = z.enum(['NEWEST', 'PRICE_ASC', 'MONTHLY_ASC', 'KM_ASC']);
export type VehicleSort = z.infer<typeof VehicleSort>;

export const VehicleListQuerySchema = z.object({
  q: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  priceMax: z.coerce.number().int().optional(),
  monthlyMax: z.coerce.number().int().optional(),
  yearMin: z.coerce.number().int().optional(),
  kmMax: z.coerce.number().int().optional(),
  fuel: z.union([z.string(), z.array(z.string())]).optional(),
  transmission: z.union([z.string(), z.array(z.string())]).optional(),
  bodyType: z.union([z.string(), z.array(z.string())]).optional(),
  sort: VehicleSort.optional().default('NEWEST'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(9),
});
export type VehicleListQuery = z.infer<typeof VehicleListQuerySchema>;

export const VehicleListResponseSchema = z.object({
  items: z.array(VehicleListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type VehicleListResponse = z.infer<typeof VehicleListResponseSchema>;
