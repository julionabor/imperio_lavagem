/**
 * Barra de pesquisa em linguagem natural com chips "Entendi:",
 * atalhos rápidos e frases de exemplo.
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import type { QuickFilter, SearchExample } from '../../data-access/site.api';
import type { FilterState } from '@pm/libs/contracts';
import { formatEur } from '../../../../shared/util/format';

@Component({
  selector: 'pm-smart-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-3.5 min-w-0">
      <!-- input principal -->
      <div class="flex items-center gap-3 bg-ink-900 rounded-[18px] px-5 py-2
                  shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.12),0_30px_80px_-30px_rgb(208_22_31_/_0.45)]">
        <svg viewBox="0 0 24 24" class="shrink-0 w-5 h-5 text-red-400" fill="none">
          <path d="M12 3a1 1 0 0 1 1-1 9 9 0 0 1 0 18 1 1 0 0 1-1-1V3Z" fill="currentColor" opacity=".3"/>
          <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z" stroke="currentColor" stroke-width="1.5"/>
          <path d="m8 10 2.5 2.5L16 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <input
          #searchInput
          type="text"
          [value]="query()"
          (input)="onInput($event)"
          (keydown.enter)="onSubmit()"
          (keydown.escape)="onClear()"
          [placeholder]="placeholder()"
          aria-label="Pesquisa em linguagem natural"
          class="flex-1 w-0 min-w-0 min-h-[52px] bg-transparent border-0
                 text-white text-[18px] font-sans outline-none
                 placeholder:text-ink-500"
        />

        @if (query()) {
          <button
            type="button"
            (click)="onClear()"
            aria-label="Apagar"
            class="w-11 h-11 rounded-md flex items-center justify-center
                   text-ink-400 hover:text-white hover:bg-ink-800
                   focus:outline-none focus:ring-2 focus:ring-red-500/40
                   transition-colors"
          >
            <svg viewBox="0 0 20 20" class="w-5 h-5" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        }

        <button
          type="button"
          (click)="onSubmit()"
          class="min-h-[52px] px-5 rounded-xl flex items-center gap-2
                 bg-red-500 hover:bg-red-600 active:bg-red-700
                 text-white text-label font-semibold whitespace-nowrap
                 focus:outline-none focus:ring-2 focus:ring-red-500/40
                 transition-colors"
        >
          <svg viewBox="0 0 20 20" class="w-5 h-5" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="m14 14 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="hidden sm:inline">Procurar</span>
        </button>
      </div>

      <!-- chips "Entendi:" -->
      @if (parsed() && parsedChips().length) {
        <div class="flex flex-wrap items-center gap-2 text-[13px] text-ink-400 animate-[pmUp_.2s_ease]">
          <span>Entendi:</span>
          @for (chip of parsedChips(); track chip) {
            <span class="inline-flex items-center min-h-[30px] px-3 rounded-full
                         text-red-200 bg-red-950/80
                         shadow-[inset_0_0_0_1px_#8c0f15] whitespace-nowrap text-[13px]">
              {{ chip }}
            </span>
          }
          <span class="text-ink-600">· Enter para fixar</span>
        </div>
      }

      <!-- atalhos rápidos + exemplos (quando sem pesquisa) -->
      @if (!parsed()) {
        @if (quickFilters().length) {
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[13px] text-ink-400 mr-1">Atalhos</span>
            @for (qf of quickFilters(); track qf.id) {
              <button
                type="button"
                (click)="quickFilterSelected.emit(qf)"
                class="min-h-[36px] px-3.5 rounded-full text-[13px] text-white
                       bg-ink-800 border border-ink-700
                       hover:border-ink-500 hover:bg-ink-700
                       focus:outline-none focus:ring-2 focus:ring-red-500/40
                       transition-colors"
              >
                {{ qf.label }}
              </button>
            }
          </div>
        }

        @if (examples().length) {
          <div class="flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] text-ink-600">
            <span>Ou escreva como falaria:</span>
            @for (ex of examples(); track ex.id) {
              <button
                type="button"
                (click)="exampleSelected.emit(ex.text)"
                class="border-0 bg-transparent p-0 text-ink-300
                       underline underline-offset-4 decoration-ink-100/20
                       hover:text-red-400 focus:outline-none
                       min-h-[24px] transition-colors"
              >
                "{{ ex.text }}"
              </button>
            }
          </div>
        }
      }
    </div>
  `,
})
export class PmSmartSearch {
  readonly query = input<string>('');
  readonly parsed = input<FilterState | null>(null);
  readonly placeholder = input<string>('Experimente: SUV diesel até 250€/mês');
  readonly quickFilters = input<QuickFilter[]>([]);
  readonly examples = input<SearchExample[]>([]);

  readonly queryChange = output<string>();
  readonly search = output<string>();
  readonly quickFilterSelected = output<QuickFilter>();
  readonly exampleSelected = output<string>();

  protected readonly parsedChips = computed(() => {
    const p = this.parsed();
    if (!p) return [];
    const chips: string[] = [];
    if (p.brand) chips.push(p.brand);
    if (p.model) chips.push(p.model);
    if (p.fuel?.length) chips.push(...p.fuel);
    if (p.body?.length) chips.push(...p.body);
    if (p.gear) chips.push(p.gear);
    if (p.priceMax) chips.push('até ' + formatEur(p.priceMax));
    if (p.monthlyMax) chips.push('até ' + formatEur(p.monthlyMax) + '/mês');
    if (p.yearMin) chips.push('a partir de ' + p.yearMin);
    if (p.kmMax) chips.push('até ' + new Intl.NumberFormat('pt-PT').format(p.kmMax) + '\u00a0km');
    return chips;
  });

  protected onInput(e: Event) {
    this.queryChange.emit((e.target as HTMLInputElement).value);
  }

  protected onSubmit() {
    this.search.emit(this.query());
  }

  protected onClear() {
    this.queryChange.emit('');
    this.search.emit('');
  }
}
