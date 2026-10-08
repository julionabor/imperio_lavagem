import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStore } from './dashboard.store';
import { PmBadge } from '../../shared/ui/pm-badge/pm-badge';
import { PmButton } from '../../shared/ui/pm-button/pm-button';

@Component({
  selector: 'pm-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardStore],
  imports: [RouterLink, PmBadge, PmButton],
  template: `
    <div class="mx-auto max-w-5xl">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="font-display text-h1 font-semibold text-ink-100">Dashboard</h1>
        <pm-button routerLink="/admin/viaturas/nova" size="sm">+ Nova viatura</pm-button>
      </div>

      @if (store.loading()) {
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          @for (i of skeleton; track i) {
            <div class="h-24 animate-pulse rounded-xl bg-ink-800"></div>
          }
        </div>
      } @else if (store.summary(); as s) {
        <!-- KPIs -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-8">
          <div class="rounded-xl border border-ink-800 bg-ink-900 p-4">
            <p class="text-xs text-ink-500 uppercase tracking-wide">Publicadas</p>
            <p class="mt-1 text-3xl font-semibold text-ink-100">{{ s.vehicles.published }}</p>
          </div>
          <div class="rounded-xl border border-ink-800 bg-ink-900 p-4">
            <p class="text-xs text-ink-500 uppercase tracking-wide">Reservadas</p>
            <p class="mt-1 text-3xl font-semibold text-warning">{{ s.vehicles.reserved }}</p>
          </div>
          <div class="rounded-xl border border-ink-800 bg-ink-900 p-4">
            <p class="text-xs text-ink-500 uppercase tracking-wide">Vendidas</p>
            <p class="mt-1 text-3xl font-semibold text-success">{{ s.vehicles.sold }}</p>
          </div>
          <div class="rounded-xl border border-ink-800 bg-ink-900 p-4">
            <p class="text-xs text-ink-500 uppercase tracking-wide">Leads hoje</p>
            <p class="mt-1 text-3xl font-semibold text-info">{{ s.leads.today }}</p>
          </div>
          <div class="rounded-xl border border-ink-800 bg-ink-900 p-4">
            <p class="text-xs text-ink-500 uppercase tracking-wide">Leads 7 dias</p>
            <p class="mt-1 text-3xl font-semibold text-ink-100">{{ s.leads.week }}</p>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Mais vistas -->
          <div class="rounded-xl border border-ink-800 bg-ink-900 p-4">
            <h2 class="mb-3 text-sm font-medium text-ink-300">Viaturas mais vistas</h2>
            @if (s.mostViewed.length === 0) {
              <p class="text-sm text-ink-500">Sem dados.</p>
            }
            @for (v of s.mostViewed; track v.id) {
              <a
                [routerLink]="['/admin/viaturas', v.id]"
                class="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-ink-850 transition-colors"
              >
                <span class="text-sm text-ink-200 truncate">{{ v.title }}</span>
                <span class="text-xs text-ink-500 shrink-0 ml-2">{{ v.viewCount }} vistas</span>
              </a>
            }
          </div>

          <!-- Paradas -->
          <div class="rounded-xl border border-ink-800 bg-ink-900 p-4">
            <h2 class="mb-3 text-sm font-medium text-ink-300">Publicadas há +90 dias sem leads</h2>
            @if (s.stalledVehicles.length === 0) {
              <p class="text-sm text-ink-500">Tudo em ordem! 🎉</p>
            }
            @for (v of s.stalledVehicles; track v.id) {
              <a
                [routerLink]="['/admin/viaturas', v.id]"
                class="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-ink-850 transition-colors"
              >
                <span class="text-sm text-ink-200 truncate">{{ v.title }}</span>
                <pm-badge variant="warning">{{ daysSince(v.publishedAt) }}d</pm-badge>
              </a>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardPage implements OnInit {
  protected readonly store = inject(DashboardStore);
  protected readonly skeleton = [1, 2, 3, 4, 5];

  ngOnInit(): void { this.store.load(); }

  protected daysSince(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  }
}
