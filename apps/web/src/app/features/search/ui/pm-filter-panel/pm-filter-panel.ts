/**
 * Painel de 8 filtros (Marca, Modelo, Preço, Prestação, Ano, Km, Combustível, Carroçaria).
 * Inline em lg+, bottom sheet em mobile.
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import type { ActiveFilters } from '../../data-access/search.store';
import type { FacetCounts } from '../../data-access/vehicles.api';
import { PmSelect } from '../../../../shared/ui/pm-select/pm-select';
import { PmSlider } from '../../../../shared/ui/pm-slider/pm-slider';
import { formatEur, formatKm } from '../../../../shared/util/format';

interface PillOption {
  value: string;
  label: string;
  active: boolean;
}

@Component({
  selector: 'pm-filter-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PmSelect, PmSlider],
  template: `
    <!-- bottom sheet drag handle (mobile) -->
    <div class="lg:hidden w-10 h-1 rounded-full bg-ink-600 mx-auto mb-3"></div>

    <!-- cabeçalho mobile -->
    <div class="lg:hidden flex items-center justify-between mb-4">
      <h2 class="font-display font-semibold text-[20px]">Filtros</h2>
      <button
        type="button"
        (click)="closed.emit()"
        aria-label="Fechar filtros"
        class="w-11 h-11 rounded-md flex items-center justify-center
               bg-ink-800 text-ink-100 text-[18px]
               hover:bg-ink-700 focus:outline-none focus:ring-2 focus:ring-red-500/40"
      >
        <svg viewBox="0 0 20 20" class="w-5 h-5" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- grid de filtros -->
    <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-5 gap-x-7">
      <!-- marca -->
      <pm-select
        label="Marca"
        placeholder="Todas"
        [options]="brandOptions()"
        [value]="filters().brand ?? null"
        (valueChange)="filterChanged.emit({ key: 'brand', value: $event ?? undefined })"
      />

      <!-- modelo -->
      <pm-select
        label="Modelo"
        placeholder="Todos"
        [options]="modelOptions()"
        [value]="filters().model ?? null"
        (valueChange)="filterChanged.emit({ key: 'model', value: $event ?? undefined })"
      />

      <!-- preço -->
      <pm-slider
        label="Preço até"
        [min]="1000000"
        [max]="6000000"
        [step]="100000"
        [value]="filters().priceMax ?? 6000000"
        [format]="formatPriceFn"
        (valueChange)="filterChanged.emit({ key: 'priceMax', value: $event < 6000000 ? $event : undefined })"
      />

      <!-- prestação -->
      <pm-slider
        label="Prestação até"
        [min]="15000"
        [max]="90000"
        [step]="1000"
        [value]="filters().budget ?? 90000"
        [format]="formatMonthlyFn"
        (valueChange)="filterChanged.emit({ key: 'budget', value: $event < 90000 ? $event : undefined })"
      />

      <!-- ano -->
      <div class="grid gap-2 content-start">
        <span class="text-caption text-ink-400">Ano, a partir de</span>
        <div class="flex flex-wrap gap-1.5">
          @for (p of yearPills(); track p.value) {
            <button
              type="button"
              (click)="filterChanged.emit({ key: 'yearMin', value: p.active ? undefined : +p.value })"
              class="min-h-[36px] px-3 rounded-md text-label transition-colors
                     focus:outline-none focus:ring-2 focus:ring-red-500/40"
              [class]="p.active ? 'bg-red-500 text-white' : 'bg-ink-800 border border-ink-700 text-ink-300 hover:border-ink-500'"
            >{{ p.label }}</button>
          }
        </div>
      </div>

      <!-- km -->
      <div class="grid gap-2 content-start">
        <span class="text-caption text-ink-400">Quilómetros</span>
        <div class="flex flex-wrap gap-1.5">
          @for (p of kmPills(); track p.value) {
            <button
              type="button"
              (click)="filterChanged.emit({ key: 'kmMax', value: p.active ? undefined : +p.value })"
              class="min-h-[36px] px-3 rounded-md text-label transition-colors
                     focus:outline-none focus:ring-2 focus:ring-red-500/40"
              [class]="p.active ? 'bg-red-500 text-white' : 'bg-ink-800 border border-ink-700 text-ink-300 hover:border-ink-500'"
            >{{ p.label }}</button>
          }
        </div>
      </div>

      <!-- combustível -->
      <div class="grid gap-2 content-start">
        <span class="text-caption text-ink-400">Combustível</span>
        <div class="flex flex-wrap gap-1.5">
          @for (p of fuelPills(); track p.value) {
            <button
              type="button"
              (click)="toggleMulti('fuel', p.value)"
              class="min-h-[36px] px-3 rounded-md text-label transition-colors
                     focus:outline-none focus:ring-2 focus:ring-red-500/40"
              [class]="p.active ? 'bg-red-500 text-white' : 'bg-ink-800 border border-ink-700 text-ink-300 hover:border-ink-500'"
            >
              {{ p.label }}
              @if (facets().fuel[p.value] !== undefined) {
                <span class="ml-1 text-ink-500">({{ facets().fuel[p.value] }})</span>
              }
            </button>
          }
        </div>
      </div>

      <!-- carroçaria -->
      <div class="grid gap-2 content-start">
        <span class="text-caption text-ink-400">Carroçaria</span>
        <div class="flex flex-wrap gap-1.5">
          @for (p of bodyPills(); track p.value) {
            <button
              type="button"
              (click)="toggleMulti('bodyType', p.value)"
              class="min-h-[36px] px-3 rounded-md text-label transition-colors
                     focus:outline-none focus:ring-2 focus:ring-red-500/40"
              [class]="p.active ? 'bg-red-500 text-white' : 'bg-ink-800 border border-ink-700 text-ink-300 hover:border-ink-500'"
            >
              {{ p.label }}
              @if (facets().body[p.value] !== undefined) {
                <span class="ml-1 text-ink-500">({{ facets().body[p.value] }})</span>
              }
            </button>
          }
        </div>
      </div>
    </div>

    <!-- rodapé -->
    <div class="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-ink-100/8">
      <button
        type="button"
        (click)="cleared.emit()"
        class="min-h-[touch] px-4 rounded-md border-0 bg-transparent
               text-red-400 text-label font-medium
               hover:bg-red-950/60 focus:outline-none focus:ring-2 focus:ring-red-500/40
               transition-colors"
      >
        Limpar tudo
      </button>
      <button
        type="button"
        (click)="closed.emit()"
        class="min-h-[touch] px-5 rounded-md border-0
               bg-red-500 hover:bg-red-600
               text-white text-label font-semibold tabular-nums
               focus:outline-none focus:ring-2 focus:ring-red-500/40
               transition-colors"
      >
        Ver {{ totalLabel() }}
      </button>
    </div>
  `,
})
export class PmFilterPanel {
  readonly filters = input.required<ActiveFilters>();
  readonly facets = input<FacetCounts>({ fuel: {}, body: {} });
  readonly total = input<number>(0);
  readonly brands = input<string[]>([]);
  readonly models = input<string[]>([]);

  readonly filterChanged = output<{ key: keyof ActiveFilters; value: string | number | undefined }>();
  readonly cleared = output<void>();
  readonly closed = output<void>();

  protected readonly brandOptions = computed(() =>
    this.brands().map((b) => ({ value: b, label: b })),
  );

  protected readonly modelOptions = computed(() =>
    this.models().map((m) => ({ value: m, label: m })),
  );

  protected readonly yearPills = computed((): PillOption[] =>
    [2015, 2018, 2020, 2022, 2023].map((y) => ({
      value: String(y),
      label: String(y),
      active: this.filters().yearMin === y,
    })),
  );

  protected readonly kmPills = computed((): PillOption[] =>
    [
      { value: '50000', label: '50 000 km' },
      { value: '100000', label: '100 000 km' },
      { value: '150000', label: '150 000 km' },
      { value: '200000', label: '200 000 km' },
    ].map((p) => ({ ...p, active: this.filters().kmMax === +p.value })),
  );

  protected readonly fuelPills = computed((): PillOption[] =>
    [
      { value: 'DIESEL', label: 'Diesel' },
      { value: 'PETROL', label: 'Gasolina' },
      { value: 'HYBRID', label: 'Híbrido' },
      { value: 'ELECTRIC', label: 'Elétrico' },
      { value: 'PLUG_IN_HYBRID', label: 'Plug-in' },
    ].map((p) => ({
      ...p,
      active: this.filters().fuel === p.value,
    })),
  );

  protected readonly bodyPills = computed((): PillOption[] =>
    [
      { value: 'SUV', label: 'SUV' },
      { value: 'SEDAN', label: 'Berlina' },
      { value: 'HATCHBACK', label: 'Hatchback' },
      { value: 'ESTATE', label: 'Carrinha' },
      { value: 'COUPE', label: 'Coupé' },
      { value: 'MINIVAN', label: 'Monovolume' },
    ].map((p) => ({
      ...p,
      active: this.filters().bodyType === p.value,
    })),
  );

  protected readonly totalLabel = computed(() => {
    const t = this.total();
    return t === 1 ? '1 viatura' : `${t} viaturas`;
  });

  protected toggleMulti(key: 'fuel' | 'bodyType', value: string) {
    const current = key === 'fuel' ? this.filters().fuel : this.filters().bodyType;
    this.filterChanged.emit({
      key: key as keyof ActiveFilters,
      value: current === value ? undefined : value,
    });
  }

  protected readonly formatPriceFn = (v: number) =>
    v >= 6000000 ? 'Sem limite' : formatEur(v);

  protected readonly formatMonthlyFn = (v: number) =>
    v >= 90000 ? 'Sem limite' : formatEur(v) + '/mês';
}
