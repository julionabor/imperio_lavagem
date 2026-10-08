import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Brand { id: string; name: string; slug: string; active: boolean; aliases: string[]; }
export interface Model { id: string; name: string; slug: string; brandId: string; active: boolean; aliases: string[]; }
export interface EquipmentItem { id: string; name: string; category: string; active: boolean; }
export interface SearchSynonym { id: string; term: string; maps: string; category: string; }
export interface FinancingProductSummary { id: string; name: string; isDefault: boolean; active: boolean; }

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);

  getBrands() { return this.http.get<{ data: Brand[] }>('/api/v1/admin/catalog/brands'); }
  createBrand(data: Partial<Brand>) { return this.http.post<Brand>('/api/v1/admin/catalog/brands', data); }
  updateBrand(id: string, data: Partial<Brand>) { return this.http.patch<Brand>(`/api/v1/admin/catalog/brands/${id}`, data); }
  deleteBrand(id: string) { return this.http.delete<void>(`/api/v1/admin/catalog/brands/${id}`); }

  getModels() { return this.http.get<{ data: Model[] }>('/api/v1/admin/catalog/models'); }
  createModel(data: Partial<Model>) { return this.http.post<Model>('/api/v1/admin/catalog/models', data); }
  updateModel(id: string, data: Partial<Model>) { return this.http.patch<Model>(`/api/v1/admin/catalog/models/${id}`, data); }
  deleteModel(id: string) { return this.http.delete<void>(`/api/v1/admin/catalog/models/${id}`); }

  getEquipment() { return this.http.get<{ data: EquipmentItem[] }>('/api/v1/admin/catalog/equipment'); }
  createEquipment(data: Partial<EquipmentItem>) { return this.http.post<EquipmentItem>('/api/v1/admin/catalog/equipment', data); }
  updateEquipment(id: string, data: Partial<EquipmentItem>) { return this.http.patch<EquipmentItem>(`/api/v1/admin/catalog/equipment/${id}`, data); }
  deleteEquipment(id: string) { return this.http.delete<void>(`/api/v1/admin/catalog/equipment/${id}`); }

  getSynonyms() { return this.http.get<{ data: SearchSynonym[] }>('/api/v1/admin/catalog/search-synonyms'); }
  createSynonym(data: Partial<SearchSynonym>) { return this.http.post<SearchSynonym>('/api/v1/admin/catalog/search-synonyms', data); }
  updateSynonym(id: string, data: Partial<SearchSynonym>) { return this.http.patch<SearchSynonym>(`/api/v1/admin/catalog/search-synonyms/${id}`, data); }
  deleteSynonym(id: string) { return this.http.delete<void>(`/api/v1/admin/catalog/search-synonyms/${id}`); }

  parseTest(query: string) { return this.http.post<{ chips: unknown[] }>('/api/v1/admin/catalog/search/parse-test', { query }); }

  getFinancingProducts() { return this.http.get<{ data: FinancingProductSummary[] }>('/api/v1/admin/financing-products'); }
}
