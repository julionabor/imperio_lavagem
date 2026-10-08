import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface DashboardSummary {
  vehicles: { published: number; reserved: number; sold: number };
  leads: { today: number; week: number };
  mostViewed: Array<{ id: string; title: string; viewCount: number; slug: string }>;
  stalledVehicles: Array<{ id: string; title: string; publishedAt: string; leadCount: number; slug: string }>;
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  getSummary() {
    return this.http.get<DashboardSummary>('/api/v1/admin/dashboard/summary');
  }
}
