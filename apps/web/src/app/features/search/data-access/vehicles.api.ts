import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

// ── DTOs espelho dos endpoints /public/vehicles ───────────────────────────────

export interface CoverImage {
  id: string;
  alt: string;
  variants: { thumb: string; card: string; full: string };
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

export interface VehicleDetail extends VehicleListItem {
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

export interface VehicleListItem {
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
  coverImage: CoverImage | null;
  publishedAt: string | null;
  daysInStock: number;
  isFeatured: boolean;
  badges: string[];
  budgetStatus?: 'FITS' | 'NEAR';
  budgetDiffCents?: number;
}

export interface FacetCounts {
  fuel: Record<string, number>;
  body: Record<string, number>;
}

export interface VehicleListResult {
  data: VehicleListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: FacetCounts;
}

export interface VehicleSuggestion {
  type: 'RELAXED_FILTER' | 'RELATED_BRAND' | 'POPULAR';
  label: string;
  filters: Record<string, string>;
  count: number;
}

export interface SuggestionsResult {
  suggestions: VehicleSuggestion[];
}

export interface VehicleListParams {
  brand?: string;
  model?: string;
  priceMax?: number;
  yearMin?: number;
  kmMax?: number;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  sort?: 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'MILEAGE_ASC' | 'YEAR_DESC';
  page?: number;
  pageSize?: number;
  budget?: number;
  down?: number;
  term?: number;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class VehiclesApi {
  private readonly http = inject(HttpClient);

  list(params: VehicleListParams = {}) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        p = p.set(k, String(v));
      }
    }
    return this.http.get<VehicleListResult>('/api/v1/public/vehicles', { params: p });
  }

  suggestions(params: Omit<VehicleListParams, 'sort' | 'page' | 'pageSize' | 'budget' | 'down' | 'term'> = {}) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        p = p.set(k, String(v));
      }
    }
    return this.http.get<SuggestionsResult>('/api/v1/public/vehicles/suggestions', { params: p });
  }

  getBySlug(slug: string) {
    return this.http.get<VehicleDetail>(`/api/v1/public/vehicles/${slug}`);
  }

  getSimilar(slug: string) {
    return this.http.get<VehicleListItem[]>(`/api/v1/public/vehicles/${slug}/similar`);
  }
}
