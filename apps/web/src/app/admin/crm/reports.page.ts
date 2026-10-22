import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { CrmApi, type CrmReports } from './crm.api';

const TYPE_LABELS: Record<string, string> = {
  QUOTE: 'Orçamento', TEST_DRIVE: 'Test Drive', CONTACT: 'Contacto',
  TRADE_IN: 'Retoma', FINANCING: 'Financiamento', SOURCING: 'Pesquisa',
};
const SOURCE_LABELS: Record<string, string> = {
  VEHICLE_PAGE: 'Página viatura', HOME_SEARCH: 'Homepage', BUDGET_SEARCH: 'Orçamento',
  EMPTY_STATE: 'Sem resultados', QUOTE_FORM: 'Formulário', CONTACT_PAGE: 'Contactos',
  WHATSAPP: 'WhatsApp', ASSISTANT: 'Assistente',
};

@Component({
  selector: 'pm-reports-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-h2 font-display font-bold mb-6">Relatórios CRM</h1>

    @if (loading()) {
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        @for (i of [1,2,3,4]; track i) {
          <div class="rounded-xl bg-ink-900 h-24 animate-pulse"></div>
        }
      </div>
    } @else if (data(); as r) {
      <!-- KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="rounded-xl bg-ink-900 p-4">
          <p class="text-caption text-ink-500 mb-1">Total leads</p>
          <p class="text-h2 font-display font-bold">{{ r.totalLeads }}</p>
        </div>
        <div class="rounded-xl bg-ink-900 p-4">
          <p class="text-caption text-ink-500 mb-1">Este mês</p>
          <p class="text-h2 font-display font-bold">{{ r.leadsThisMonth }}</p>
          <p class="text-caption mt-0.5"
             [class]="r.leadsThisMonth >= r.leadsLastMonth ? 'text-green-400' : 'text-red-400'">
            {{ r.leadsThisMonth >= r.leadsLastMonth ? '▲' : '▼' }}
            vs {{ r.leadsLastMonth }} mês passado
          </p>
        </div>
        <div class="rounded-xl bg-ink-900 p-4">
          <p class="text-caption text-ink-500 mb-1">Taxa de conversão</p>
          <p class="text-h2 font-display font-bold">{{ r.conversionRate }}%</p>
          <p class="text-caption text-ink-600">{{ r.wonThisMonth }} ganhos este mês</p>
        </div>
        <div class="rounded-xl bg-ink-900 p-4">
          <p class="text-caption text-ink-500 mb-1">Tarefas abertas</p>
          <p class="text-h2 font-display font-bold">{{ r.openTasks }}</p>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <!-- Por etapa -->
        <div class="rounded-xl bg-ink-900 p-4">
          <h2 class="text-label font-semibold mb-4">Por etapa</h2>
          @for (s of r.byStage; track s.name) {
            <div class="flex items-center justify-between py-2 border-b border-ink-800 last:border-0">
              <span class="text-label text-ink-300">{{ s.name }}</span>
              <span class="text-label font-semibold text-white">{{ s.count }}</span>
            </div>
          }
        </div>

        <!-- Por tipo -->
        <div class="rounded-xl bg-ink-900 p-4">
          <h2 class="text-label font-semibold mb-4">Por tipo</h2>
          @for (t of r.byType; track t.type) {
            <div class="flex items-center justify-between py-2 border-b border-ink-800 last:border-0">
              <span class="text-label text-ink-300">{{ typeLabel(t.type) }}</span>
              <span class="text-label font-semibold text-white">{{ t.count }}</span>
            </div>
          }
        </div>

        <!-- Por origem -->
        <div class="rounded-xl bg-ink-900 p-4">
          <h2 class="text-label font-semibold mb-4">Por origem</h2>
          @for (s of r.bySource; track s.source) {
            <div class="flex items-center justify-between py-2 border-b border-ink-800 last:border-0">
              <span class="text-label text-ink-300">{{ sourceLabel(s.source) }}</span>
              <span class="text-label font-semibold text-white">{{ s.count }}</span>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class ReportsPage implements OnInit {
  private readonly api = inject(CrmApi);

  protected readonly loading = signal(true);
  protected readonly data = signal<CrmReports | null>(null);

  ngOnInit() {
    this.api.getReports().subscribe({
      next: (r) => { this.data.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected typeLabel(t: string) { return TYPE_LABELS[t] ?? t; }
  protected sourceLabel(s: string) { return SOURCE_LABELS[s] ?? s; }
}
