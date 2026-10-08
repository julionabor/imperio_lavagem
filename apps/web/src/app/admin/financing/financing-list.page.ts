import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FinancingAdminApi, type FinancingProductAdmin } from './financing-admin.api';
import { PmButton } from '../../shared/ui/pm-button/pm-button';
import { PmBadge } from '../../shared/ui/pm-badge/pm-badge';
import { ConfirmDialogService } from '../../shared/ui/pm-confirm-dialog/pm-confirm-dialog';
import { ToastService } from '../../shared/ui/pm-toast/pm-toast';
import { formatBp } from '../../shared/util/format';

@Component({
  selector: 'pm-financing-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PmButton, PmBadge],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="font-display text-h1 font-semibold text-ink-100">Financiamento</h1>
        <pm-button routerLink="/admin/financiamento/novo" size="sm">+ Novo produto</pm-button>
      </div>

      <div class="flex flex-col gap-3">
        @for (p of products(); track p.id) {
          <div class="flex items-center justify-between rounded-xl border border-ink-800 bg-ink-900 px-5 py-4">
            <div>
              <div class="flex items-center gap-2">
                <p class="font-medium text-ink-100">{{ p.name }}</p>
                @if (p.isDefault) {
                  <pm-badge variant="success">Padrão</pm-badge>
                }
                @if (!p.active) {
                  <pm-badge variant="neutral">Inativo</pm-badge>
                }
              </div>
              <p class="mt-0.5 text-sm text-ink-400">
                {{ p.lenderName }} ·
                {{ p.rateMode === 'TAEG_INPUT' ? 'TAEG ' + formatBp(p.taegBp) : 'TAN ' + formatBp(p.tanBp) }}
              </p>
            </div>
            <div class="flex gap-2">
              @if (!p.isDefault) {
                <pm-button variant="secondary" size="sm" (click)="onSetDefault(p.id)">Definir padrão</pm-button>
              }
              <pm-button variant="secondary" size="sm" [routerLink]="['/admin/financiamento', p.id]">Editar</pm-button>
            </div>
          </div>
        }
        @if (loading()) {
          @for (i of [1,2]; track i) {
            <div class="h-20 animate-pulse rounded-xl bg-ink-800"></div>
          }
        }
      </div>
    </div>
  `,
})
export class FinancingListPage implements OnInit {
  private readonly api = inject(FinancingAdminApi);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  protected readonly products = signal<FinancingProductAdmin[]>([]);
  protected readonly loading = signal(false);
  protected readonly formatBp = formatBp;

  ngOnInit(): void { this.load(); }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.list());
      this.products.set(res.data);
    } finally {
      this.loading.set(false);
    }
  }

  protected async onSetDefault(id: string): Promise<void> {
    const ok = await this.confirm.open({ title: 'Definir produto padrão', message: 'Este produto passará a ser usado em todo o site. Confirmar?', confirmLabel: 'Definir' });
    if (!ok) return;
    try {
      await firstValueFrom(this.api.setDefault(id));
      this.toast.success('Produto padrão atualizado.');
      await this.load();
    } catch {
      this.toast.error('Erro ao definir produto padrão.');
    }
  }
}
