import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface FinancingProductAdmin {
  id: string;
  name: string;
  lenderName: string;
  isDefault: boolean;
  active: boolean;
  rateMode: 'TAEG_INPUT' | 'TAN_AND_FEES';
  taegBp: number;
  tanBp: number;
  allowedTerms: number[];
  defaultTermMonths: number;
  defaultDownPaymentPct: number;
  maxDownPaymentPct: number;
  minFinancedCents: number;
  maxFinancedCents: number;
  openingFeeCents: number;
  monthlyFeeCents: number;
  stampDutyRateBp: number;
  maxVehicleAgeAtEndYears: number | null;
  budgetNearPct: number;
  representativeExampleTemplate: string | null;
  legalNote: string | null;
  validFrom: string | null;
  validTo: string | null;
  updatedAt: string;
}

export interface SimulateRequest {
  priceCents: number;
  entryCents: number;
  termMonths: number;
  financingProductId?: string;
}

export interface SimulateResponse {
  principalCents: number;
  monthlyPaymentCents: number;
  mticCents: number;
  interestCents: number;
  impliedTanBp: number | null;
  taegBp: number;
  entryCents: number;
  termMonths: number;
}

@Injectable({ providedIn: 'root' })
export class FinancingAdminApi {
  private readonly http = inject(HttpClient);

  list() { return this.http.get<{ data: FinancingProductAdmin[] }>('/api/v1/admin/financing-products'); }
  get(id: string) { return this.http.get<FinancingProductAdmin>(`/api/v1/admin/financing-products/${id}`); }
  create(data: Partial<FinancingProductAdmin>) { return this.http.post<FinancingProductAdmin>('/api/v1/admin/financing-products', data); }
  update(id: string, data: Partial<FinancingProductAdmin>) { return this.http.patch<FinancingProductAdmin>(`/api/v1/admin/financing-products/${id}`, data); }
  setDefault(id: string) { return this.http.post<void>(`/api/v1/admin/financing-products/${id}/default`, {}); }
  simulate(data: SimulateRequest) { return this.http.post<SimulateResponse>('/api/v1/admin/financing-products/simulate', data); }
}
