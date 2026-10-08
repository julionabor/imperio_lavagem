import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export type VehicleStatus = 'DRAFT' | 'PUBLISHED' | 'RESERVED' | 'SOLD' | 'ARCHIVED';

export interface VehicleListItem {
  id: string;
  slug: string;
  title: string;
  brandName: string;
  modelName: string;
  year: number;
  mileageKm: number;
  priceCents: number;
  status: VehicleStatus;
  daysInStock: number;
  leadCount: number;
  viewCount: number;
  coverUrl: string | null;
}

export interface VehicleDetail {
  id: string;
  slug: string;
  status: VehicleStatus;
  condition: string;
  brandId: string;
  modelId: string;
  version: string;
  registrationDate: string;
  mileageKm: number;
  fuel: string;
  transmission: string;
  bodyType: string;
  powerHp: number | null;
  engineCc: number | null;
  doors: number | null;
  seats: number | null;
  batteryKwh: number | null;
  rangeKm: number | null;
  color: string | null;
  colorInterior: string | null;
  priceCents: number;
  previousPriceCents: number | null;
  vatDeductible: boolean;
  warrantyMonths: number;
  description: string | null;
  financingEnabled: boolean;
  financingProductId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  equipment: string[];
  images: VehicleImage[];
  updatedAt: string;
}

export interface VehicleImage {
  id: string;
  storageKey: string;
  alt: string | null;
  position: number;
  isCover: boolean;
  variants: { thumb: string; card: string; full: string };
}

export interface VehiclesListResponse {
  data: VehicleListItem[];
  meta: { page: number; pageSize: number; total: number };
}

@Injectable({ providedIn: 'root' })
export class VehiclesAdminApi {
  private readonly http = inject(HttpClient);

  list(params: {
    page?: number;
    status?: string;
    brand?: string;
    fuel?: string;
    search?: string;
  } = {}) {
    let p = new HttpParams();
    if (params.page) p = p.set('page', params.page);
    if (params.status) p = p.set('status', params.status);
    if (params.brand) p = p.set('brand', params.brand);
    if (params.fuel) p = p.set('fuel', params.fuel);
    if (params.search) p = p.set('search', params.search);
    return this.http.get<VehiclesListResponse>('/api/v1/admin/vehicles', { params: p });
  }

  get(id: string) {
    return this.http.get<VehicleDetail>(`/api/v1/admin/vehicles/${id}`);
  }

  create(data: Partial<VehicleDetail>) {
    return this.http.post<VehicleDetail>('/api/v1/admin/vehicles', data);
  }

  update(id: string, data: Partial<VehicleDetail>) {
    return this.http.patch<VehicleDetail>(`/api/v1/admin/vehicles/${id}`, data);
  }

  changeStatus(id: string, status: VehicleStatus) {
    return this.http.post<VehicleDetail>(`/api/v1/admin/vehicles/${id}/status`, { status });
  }

  duplicate(id: string) {
    return this.http.post<VehicleDetail>(`/api/v1/admin/vehicles/${id}/duplicate`, {});
  }

  uploadImages(vehicleId: string, files: File[]) {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return this.http.post<VehicleImage[]>(`/api/v1/admin/vehicles/${vehicleId}/images`, form);
  }

  reorderImages(vehicleId: string, imageIds: string[]) {
    return this.http.patch<void>(`/api/v1/admin/vehicles/${vehicleId}/images/reorder`, { imageIds });
  }

  updateImage(vehicleId: string, imageId: string, data: { alt?: string; isCover?: boolean }) {
    return this.http.patch<VehicleImage>(`/api/v1/admin/vehicles/${vehicleId}/images/${imageId}`, data);
  }

  deleteImage(vehicleId: string, imageId: string) {
    return this.http.delete<void>(`/api/v1/admin/vehicles/${vehicleId}/images/${imageId}`);
  }
}
