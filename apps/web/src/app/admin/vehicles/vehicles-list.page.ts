import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehiclesAdminStore } from './vehicles-admin.store';
import { PmDataTable, type TableColumn } from '../../shared/ui/pm-data-table/pm-data-table';
import { PmButton } from '../../shared/ui/pm-button/pm-button';
import { PmBadge } from '../../shared/ui/pm-badge/pm-badge';
import { ConfirmDialogService } from '../../shared/ui/pm-confirm-dialog/pm-confirm-dialog';
import { formatEur } from '../../shared/util/format';
import type { VehicleListItem, VehicleStatus } from './vehicles-admin.api';

const STATUS_LABELS: Record<VehicleStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicada',
  RESERVED: 'Reservada',
  SOLD: 'Vendida',
  ARCHIVED: 'Arquivada',
};

@Component({
  selector: 'pm-vehicles-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [VehiclesAdminStore],
  imports: [RouterLink, FormsModule, PmDataTable, PmButton, PmBadge],
  template: `
    <div class="mx-auto max-w-6xl">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="font-display text-h1 font-semibold text-ink-100">Viaturas</h1>
        <pm-button routerLink="/admin/viaturas/nova" size="sm">+ Nova viatura</pm-button>
      </div>

      <!-- Filtros -->
      <div class="mb-4 flex flex-wrap gap-3">
        <select
          [(ngModel)]="filterStatus"
          (ngModelChange)="onStatusChange($event)"
          class="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-200"
        >
          <option value="">Todos os estados</option>
          @for (s of statuses; track s.value) {
            <option [value]="s.value">{{ s.label }}</option>
          }
        </select>
        <input
          type="search"
          placeholder="Pesquisar…"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          class="flex-1 min-w-48 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-200 placeholder-ink-500 focus:border-red-400 focus:outline-none"
        />
      </div>

      <!-- Tabela -->
      <pm-data-table
        [columns]="columns"
        [rows]="store.items()"
        [loading]="store.loading()"
        [total]="store.total()"
        [page]="store.page()"
        [pageSize]="20"
        [hasActions]="true"
        (rowClick)="onRowClick($event)"
        (pageChange)="onPageChange($event)"
      >
        <!-- Ações são injetadas via ng-content mas precisamos de uma abordagem diferente -->
      </pm-data-table>

      <!-- Lista manual com ações (mais flexível que a tabela genérica para este caso) -->
      @if (!store.loading() && store.items().length > 0) {
        <div class="mt-4 overflow-x-auto rounded-xl border border-ink-800">
          <table class="w-full text-sm">
            <thead class="border-b border-ink-800 bg-ink-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-400 w-16">Foto</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-400">Viatura</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-400">Estado</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-ink-400">Preço</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-ink-400">Dias</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-ink-400">Leads</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-ink-400">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-800">
              @for (v of store.items(); track v.id) {
                <tr class="hover:bg-ink-850 transition-colors cursor-pointer" (click)="router.navigate(['/admin/viaturas', v.id])">
                  <td class="px-4 py-3">
                    @if (v.coverUrl) {
                      <img [src]="v.coverUrl" [alt]="v.title" class="h-10 w-14 rounded object-cover" />
                    } @else {
                      <div class="h-10 w-14 rounded bg-ink-800 flex items-center justify-center text-ink-600 text-xs">sem foto</div>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <p class="font-medium text-ink-100">{{ v.title }}</p>
                    <p class="text-xs text-ink-500">{{ v.year }} · {{ formatKm(v.mileageKm) }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <pm-badge [variant]="statusVariant(v.status)">{{ statusLabel(v.status) }}</pm-badge>
                  </td>
                  <td class="px-4 py-3 text-right text-ink-200">{{ formatEur(v.priceCents) }}</td>
                  <td class="px-4 py-3 text-right text-ink-400">{{ v.daysInStock }}d</td>
                  <td class="px-4 py-3 text-right text-ink-400">{{ v.leadCount }}</td>
                  <td class="px-4 py-3 text-right" (click)="$event.stopPropagation()">
                    <div class="flex items-center justify-end gap-1">
                      @if (v.status === 'DRAFT') {
                        <button
                          (click)="changeStatus(v.id, 'PUBLISHED')"
                          class="rounded px-2 py-1 text-xs text-success hover:bg-success-bg transition-colors"
                        >Publicar</button>
                      }
                      @if (v.status === 'PUBLISHED') {
                        <button
                          (click)="changeStatus(v.id, 'RESERVED')"
                          class="rounded px-2 py-1 text-xs text-warning hover:bg-warning-bg transition-colors"
                        >Reservar</button>
                        <button
                          (click)="changeStatus(v.id, 'DRAFT')"
                          class="rounded px-2 py-1 text-xs text-ink-400 hover:bg-ink-800 transition-colors"
                        >Despublicar</button>
                      }
                      @if (v.status === 'RESERVED') {
                        <button
                          (click)="changeStatus(v.id, 'SOLD')"
                          class="rounded px-2 py-1 text-xs text-success hover:bg-success-bg transition-colors"
                        >Vender</button>
                      }
                      <button
                        (click)="onDuplicate(v.id)"
                        class="rounded px-2 py-1 text-xs text-ink-400 hover:bg-ink-800 transition-colors"
                      >Duplicar</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (store.total() > 20) {
          <div class="mt-4 flex items-center justify-between text-sm text-ink-400">
            <span>{{ store.total() }} viaturas</span>
            <div class="flex gap-2">
              <button
                class="px-3 py-1 rounded-lg border border-ink-700 hover:bg-ink-850 disabled:opacity-40"
                [disabled]="store.page() <= 1"
                (click)="onPageChange(store.page() - 1)"
              >← Anterior</button>
              <span class="px-3 py-1">{{ store.page() }} / {{ store.pages() }}</span>
              <button
                class="px-3 py-1 rounded-lg border border-ink-700 hover:bg-ink-850 disabled:opacity-40"
                [disabled]="store.page() >= store.pages()"
                (click)="onPageChange(store.page() + 1)"
              >Próxima →</button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class VehiclesListPage implements OnInit {
  protected readonly store = inject(VehiclesAdminStore);
  protected readonly router = inject(Router);
  private readonly confirm = inject(ConfirmDialogService);

  protected filterStatus = '';
  protected searchQuery = '';
  protected readonly formatEur = formatEur;

  protected readonly statuses = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
  protected readonly columns: TableColumn[] = [];

  protected formatKm(km: number) {
    return new Intl.NumberFormat('pt-PT').format(km) + '\u00a0km';
  }

  protected statusLabel(s: VehicleStatus) { return STATUS_LABELS[s]; }

  protected statusVariant(s: VehicleStatus) {
    const map: Record<VehicleStatus, 'success' | 'warning' | 'neutral' | 'info' | 'error'> = {
      DRAFT: 'neutral', PUBLISHED: 'success', RESERVED: 'warning', SOLD: 'info', ARCHIVED: 'error',
    };
    return map[s];
  }

  ngOnInit(): void { this.store.loadList(); }

  protected onRowClick(v: VehicleListItem): void {
    this.router.navigate(['/admin/viaturas', v.id]);
  }

  protected onPageChange(page: number): void {
    this.store.setPage(page);
    this.store.loadList();
  }

  protected onStatusChange(status: string): void {
    this.store.setFilterStatus(status);
    this.store.loadList();
  }

  protected onSearchChange(search: string): void {
    this.store.setFilterSearch(search);
    this.store.loadList();
  }

  protected changeStatus(id: string, status: VehicleStatus): void {
    this.store.changeStatus(id, status);
  }

  protected async onDuplicate(id: string): Promise<void> {
    const ok = await this.confirm.open({
      title: 'Duplicar viatura',
      message: 'Será criada uma cópia em rascunho. Continuar?',
      confirmLabel: 'Duplicar',
    });
    if (!ok) return;
    const newId = await this.store.duplicate(id);
    if (newId) this.router.navigate(['/admin/viaturas', newId]);
  }
}
