import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { catchError, EMPTY } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { SiteStore } from '../data-access/site.store';
import { SearchStore, type SortKey } from '../data-access/search.store';
import { FavoritesStore } from '../data-access/favorites.store';
import { VehiclesApi } from '../data-access/vehicles.api';
import { SiteApi } from '../data-access/site.api';
import { PmHeader } from '../../../core/layout/pm-header/pm-header';
import { PmFooter } from '../../../core/layout/pm-footer/pm-footer';
import { PmSmartSearch } from '../ui/pm-smart-search/pm-smart-search';
import { PmBudgetPicker } from '../ui/pm-budget-picker/pm-budget-picker';
import { PmFilterPanel } from '../ui/pm-filter-panel/pm-filter-panel';
import { PmVehicleCard } from '../ui/pm-vehicle-card/pm-vehicle-card';
import { PmSkeletonCard } from '../../../shared/ui/pm-skeleton-card/pm-skeleton-card';
import { PmFilterChip } from '../../../shared/ui/pm-filter-chip/pm-filter-chip';
import { PmEmptyState } from '../ui/pm-empty-state/pm-empty-state';
import { formatEur, formatKm } from '../../../shared/util/format';
import type { QuickFilter } from '../data-access/site.api';
import type { VehicleSuggestion, VehicleListItem } from '../data-access/vehicles.api';
import type { ActiveFilters } from '../data-access/search.store';

@Component({
  selector: 'pm-search-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PmHeader,
    PmFooter,
    PmSmartSearch,
    PmBudgetPicker,
    PmFilterPanel,
    PmVehicleCard,
    PmSkeletonCard,
    PmFilterChip,
    PmEmptyState,
  ],
  template: `
    <div class="min-h-screen bg-ink-950 text-white font-sans">
      <pm-header
        [nav]="siteStore.nav()"
        [settings]="siteStore.settings()"
        (assistantOpened)="openAssistant()"
      />

      <!-- HERO -->
      <section
        class="[container-type:inline-size]
               bg-[radial-gradient(70%_60%_at_0%_0%,rgb(208_22_31_/_0.20),transparent_70%),
                   radial-gradient(50%_50%_at_100%_10%,rgb(208_22_31_/_0.07),transparent_70%)]"
      >
        <div class="max-w-[--container-page] mx-auto px-6
                    py-[clamp(40px,8cqi,96px)] pb-10 grid gap-7">
          <!-- headline -->
          <div class="grid gap-4 max-w-[860px]">
            <div class="flex items-center gap-2.5 text-[12px] font-medium
                        tracking-[.12em] uppercase text-ink-300">
              <span class="w-1.5 h-1.5 rounded-full bg-success
                           shadow-[0_0_0_4px_rgb(76_211_138_/_0.15)]"></span>
              @if (siteStore.stockCount()) {
                {{ siteStore.stockCount() }} viaturas em stock
              } @else {
                Stock disponível
              }
            </div>
            <h1 class="m-0 font-display font-black text-display-2xl tracking-display-2xl
                       leading-[0.96] text-white text-balance">
              {{ siteStore.homeContent()?.heroTitle ?? 'O seu próximo carro, à distância de uma frase.' }}
            </h1>
            <p class="m-0 text-body-lg text-ink-300 max-w-[600px] text-pretty">
              {{ siteStore.homeContent()?.heroSubtitle ?? 'Escreva o que procura ou comece pela prestação que lhe convém. Os resultados aparecem enquanto escreve.' }}
            </p>
          </div>

          <!-- modo de pesquisa + search inputs -->
          <div class="grid gap-3.5 max-w-[980px]">
            <!-- tabs de modo -->
            <div role="tablist" class="flex gap-1 flex-wrap">
              <button
                role="tab"
                type="button"
                [attr.aria-selected]="searchStore.mode() === 'car'"
                (click)="searchStore.setMode('car')"
                class="min-h-[touch] px-4 rounded-md flex items-center gap-2 text-label font-medium
                       border-0 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-red-500/40"
                [class]="searchStore.mode() === 'car'
                  ? 'bg-white text-ink-950'
                  : 'bg-ink-850 text-ink-300 hover:bg-ink-800 hover:text-white'"
              >
                <svg viewBox="0 0 20 20" class="w-[18px] h-[18px]" fill="none">
                  <path d="M3 11H1l1-3h12l1 3h-2M3 11v4h14v-4M3 11h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="5.5" cy="16.5" r="1.5" fill="currentColor"/>
                  <circle cx="14.5" cy="16.5" r="1.5" fill="currentColor"/>
                </svg>
                {{ siteStore.homeContent()?.modeCarLabel ?? 'Procurar por carro' }}
              </button>
              <button
                role="tab"
                type="button"
                [attr.aria-selected]="searchStore.mode() === 'budget'"
                (click)="searchStore.setMode('budget')"
                class="min-h-[touch] px-4 rounded-md flex items-center gap-2 text-label font-medium
                       border-0 transition-colors
                       focus:outline-none focus:ring-2 focus:ring-red-500/40"
                [class]="searchStore.mode() === 'budget'
                  ? 'bg-white text-ink-950'
                  : 'bg-ink-850 text-ink-300 hover:bg-ink-800 hover:text-white'"
              >
                <svg viewBox="0 0 20 20" class="w-[18px] h-[18px]" fill="none">
                  <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2ZM7 10h6M10 7v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                {{ siteStore.homeContent()?.modeBudgetLabel ?? 'Quanto posso pagar por mês?' }}
              </button>
            </div>

            @if (searchStore.mode() === 'car') {
              <pm-smart-search
                [query]="searchStore.query()"
                [parsed]="searchStore.parsed()"
                [placeholder]="siteStore.homeContent()?.searchPlaceholder ?? 'Experimente: SUV diesel até 250€/mês'"
                [quickFilters]="siteStore.quickFilters()"
                [examples]="siteStore.searchExamples()"
                (queryChange)="onQueryChange($event)"
                (search)="onSearch($event)"
                (quickFilterSelected)="onQuickFilter($event)"
                (exampleSelected)="onExample($event)"
              />
            }

            @if (searchStore.mode() === 'budget') {
              <pm-budget-picker
                [budget]="searchStore.filters().budget ?? 30000"
                [down]="searchStore.filters().down ?? 0"
                [term]="searchStore.filters().term ?? 96"
                [fitCount]="fitCount()"
                [nearCount]="nearCount()"
                [taegBp]="siteStore.financingProduct()?.taegBp ?? null"
                (budgetChange)="searchStore.setFilter('budget', $event)"
                (downChange)="searchStore.setFilter('down', $event)"
                (termChange)="searchStore.setFilter('term', $event)"
              />
            }
          </div>
        </div>
      </section>

      <!-- DESTAQUES (above results, hidden when filters/search active) -->
      @defer (on idle) {
        @if (featured().length > 0 && searchStore.activeFilterCount() === 0 && !searchStore.query()) {
          <section class="py-10 border-t border-ink-800/50
                          bg-[radial-gradient(60%_80%_at_50%_0%,rgb(208_22_31_/_0.08),transparent_70%)]">
            <div class="max-w-[--container-page] mx-auto grid gap-5">

              <!-- header -->
              <div class="px-6 flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-3 flex-wrap">
                  <div class="flex items-center gap-2.5">
                    <span class="w-1 h-7 rounded-full bg-red-500 shrink-0"></span>
                    <h2 class="m-0 font-display font-bold text-h2 tracking-[-0.03em]">
                      {{ siteStore.homeContent()?.featuredTitle ?? 'Em destaque' }}
                    </h2>
                  </div>
                  <span class="text-[14px] text-ink-400">
                    {{ siteStore.homeContent()?.featuredSubtitle ?? 'Escolhidas pela equipa esta semana' }}
                  </span>
                </div>
                @if (featured().length > 1) {
                  <div class="flex gap-2">
                    <button type="button"
                            (click)="carouselEl.scrollBy({left: -460, behavior: 'smooth'})"
                            aria-label="Anterior"
                            class="w-9 h-9 rounded-full flex items-center justify-center
                                   bg-ink-800 hover:bg-ink-700 border border-ink-700
                                   text-ink-300 hover:text-white transition-colors">
                      <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
                        <path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <button type="button"
                            (click)="carouselEl.scrollBy({left: 460, behavior: 'smooth'})"
                            aria-label="Seguinte"
                            class="w-9 h-9 rounded-full flex items-center justify-center
                                   bg-ink-800 hover:bg-ink-700 border border-ink-700
                                   text-ink-300 hover:text-white transition-colors">
                      <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
                        <path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>

              <!-- carousel -->
              <div #carouselEl
                   class="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth
                          px-6 pb-4
                          [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                @for (v of featured(); track v.id; let first = $first) {
                  <div class="snap-start shrink-0 w-[min(88vw,440px)]">
                    <pm-vehicle-card
                      [vehicle]="v"
                      [financingProduct]="siteStore.financingProduct()"
                      variant="featured"
                      [priority]="first"
                    />
                  </div>
                }
              </div>

            </div>
          </section>
        }
      }

      <!-- RESULTADOS -->
      <section class="py-2 pb-16">
        <div class="max-w-[--container-page] mx-auto px-6">
          <!-- barra de ordenação + filtros -->
          <div class="flex flex-wrap items-center gap-3 gap-x-4 py-4">
            <h2
              class="m-0 font-display font-semibold text-[22px] tracking-[-0.02em] tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              @if (searchStore.loading() && !searchStore.initialized()) {
                A carregar...
              } @else {
                {{ countLabel() }}
              }
            </h2>

            <div class="flex gap-2 ml-auto items-center">
              <!-- ordenar -->
              <label class="flex items-center gap-2 text-[13px] text-ink-400">
                <span class="hidden sm:inline">Ordenar</span>
                <select
                  [value]="searchStore.sort()"
                  (change)="onSort($event)"
                  aria-label="Ordenar resultados"
                  class="min-h-[touch] pl-3.5 pr-9 rounded-md border-0
                         bg-ink-850 text-white text-label font-medium
                         shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.1)]
                         cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/40
                         appearance-none"
                >
                  <option value="NEWEST">Mais recentes</option>
                  <option value="PRICE_ASC">Preço crescente</option>
                  <option value="PRICE_DESC">Preço decrescente</option>
                  <option value="MILEAGE_ASC">Menos quilómetros</option>
                  <option value="YEAR_DESC">Ano (recente)</option>
                </select>
              </label>

              <!-- botão filtros -->
              <button
                type="button"
                (click)="filterPanelOpen.set(!filterPanelOpen())"
                class="min-h-[touch] px-4 rounded-md flex items-center gap-2 border-0
                       text-label font-medium transition-colors
                       focus:outline-none focus:ring-2 focus:ring-red-500/40"
                [class]="searchStore.activeFilterCount() > 0
                  ? 'bg-red-950 text-red-300 shadow-[inset_0_0_0_1px_#8c0f15]'
                  : 'bg-ink-850 text-white shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.1)] hover:bg-ink-800'"
              >
                <svg viewBox="0 0 20 20" class="w-[18px] h-[18px]" fill="none">
                  <path d="M3 5h14M5 10h10M8 15h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Filtros
                @if (searchStore.activeFilterCount() > 0) {
                  <span class="min-w-[22px] h-[22px] px-1.5 rounded-full
                               bg-red-500 text-white text-[12px] grid place-items-center">
                    {{ searchStore.activeFilterCount() }}
                  </span>
                }
              </button>
            </div>
          </div>

          <!-- chips de filtros ativos -->
          @if (activeChips().length > 0) {
            <div class="flex flex-wrap gap-2 items-center pb-2">
              @for (chip of activeChips(); track chip.key) {
                <pm-filter-chip
                  [label]="chip.label"
                  (removed)="searchStore.removeFilter(chip.key)"
                />
              }
              <button
                type="button"
                (click)="searchStore.clearFilters()"
                class="min-h-[36px] px-3 rounded-full border-0 bg-transparent
                       text-red-400 text-[13px] font-medium
                       hover:bg-red-950/60
                       focus:outline-none
                       transition-colors"
              >
                Limpar tudo
              </button>
            </div>
          }

          <!-- painel de filtros inline lg+ / bottom sheet mobile -->
          @if (filterPanelOpen()) {
            <!-- backdrop mobile -->
            <div
              class="lg:hidden fixed inset-0 z-[39] bg-black/60 animate-[pmUp_.2s_ease]"
              (click)="filterPanelOpen.set(false)"
            ></div>

            <!-- painel -->
            <div
              class="lg:mb-4 lg:p-5 lg:rounded-xl lg:bg-ink-850 lg:shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.08)]
                     max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:z-40
                     max-lg:rounded-t-2xl max-lg:bg-ink-850 max-lg:p-5 max-lg:pb-8
                     max-lg:shadow-overlay max-lg:max-h-[85vh] max-lg:overflow-y-auto
                     animate-[pmUp_.25s_ease]"
              role="dialog"
              aria-label="Filtros"
            >
              <pm-filter-panel
                [filters]="searchStore.filters()"
                [facets]="searchStore.facets()"
                [total]="searchStore.total()"
                [brands]="brandList()"
                [models]="modelList()"
                (filterChanged)="onFilterChanged($event)"
                (cleared)="searchStore.clearFilters()"
                (closed)="filterPanelOpen.set(false)"
              />
            </div>
          }

          <!-- grelha de viaturas -->
          @if (searchStore.loading() && !searchStore.initialized()) {
            <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5 mt-3">
              @for (_ of skeletons; track $index) {
                <pm-skeleton-card />
              }
            </div>
          } @else if (searchStore.isEmpty()) {
            <pm-empty-state
              [suggestions]="emptySuggestions()"
              (suggestionSelected)="onSuggestion($event)"
              (assistantRequested)="openAssistant()"
              (cleared)="searchStore.clearFilters()"
            />
          } @else {
            <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5 mt-3">
              @for (vehicle of searchStore.vehicles(); track vehicle.id; let first = $first) {
                <pm-vehicle-card
                  [vehicle]="vehicle"
                  [financingProduct]="siteStore.financingProduct()"
                  [priority]="first"
                />
              }
            </div>

            @if (searchStore.page() < searchStore.totalPages()) {
              <div class="flex justify-center mt-7">
                <button
                  type="button"
                  (click)="searchStore.loadMore()"
                  [disabled]="searchStore.loading()"
                  class="min-h-[48px] px-6 rounded-md border-0 bg-transparent
                         text-white text-label font-medium
                         shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.18)]
                         hover:bg-ink-850 disabled:opacity-50
                         focus:outline-none focus:ring-2 focus:ring-red-500/40
                         transition-colors"
                >
                  Ver mais viaturas ({{ searchStore.total() - searchStore.vehicles().length }} restantes)
                </button>
              </div>
            }
          }
        </div>
      </section>

      <!-- VANTAGENS -->
      @defer (on idle) {
        @if (siteStore.advantages().length > 0) {
          <section class="py-16">
            <div class="max-w-[--container-page] mx-auto px-6 grid gap-8">
              <h2 class="m-0 font-display font-bold text-h2 tracking-[-0.03em] max-w-[620px] text-balance">
                {{ siteStore.homeContent()?.advantagesTitle ?? 'Comprar aqui é simples e fica tudo por escrito.' }}
              </h2>
              <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-7">
                @for (adv of siteStore.advantages(); track adv.id) {
                  <div class="grid gap-2.5 content-start pt-5 border-t border-ink-100/10">
                    <span class="text-[26px] text-red-400 select-none" aria-hidden="true">
                      {{ adv.icon }}
                    </span>
                    <h3 class="m-0 font-semibold text-[17px]">{{ adv.title }}</h3>
                    <p class="m-0 text-[14px] leading-relaxed text-ink-400 text-pretty">
                      {{ adv.text }}
                    </p>
                  </div>
                }
              </div>
            </div>
          </section>
        }
      }

      <!-- TESTEMUNHOS -->
      @defer (on idle) {
        @if (siteStore.testimonials().length > 0) {
          <section class="py-6 pb-16">
            <div class="max-w-[--container-page] mx-auto px-6 grid gap-6">
              <div class="flex items-center gap-3 flex-wrap">
                <h2 class="m-0 font-display font-bold text-h2 tracking-[-0.03em] mr-auto">
                  {{ siteStore.homeContent()?.testimonialsTitle ?? 'Quem já comprou' }}
                </h2>
                @if (siteStore.settings()?.googleRating) {
                  <span class="flex items-center gap-2 text-[14px] text-ink-300">
                    <span class="text-warning tracking-[2px]">★★★★★</span>
                    {{ siteStore.settings()!.googleRating }} no Google
                    @if (siteStore.settings()!.googleReviewCount) {
                      · {{ siteStore.settings()!.googleReviewCount }} avaliações
                    }
                  </span>
                }
              </div>
              <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
                @for (t of siteStore.testimonials(); track t.id) {
                  <figure class="m-0 p-6 rounded-lg bg-ink-900 shadow-card grid gap-4 content-between">
                    <blockquote class="m-0 text-[16px] leading-relaxed text-ink-200 text-pretty">
                      "{{ t.text }}"
                    </blockquote>
                    <figcaption class="flex items-center gap-3">
                      <span class="w-10 h-10 rounded-full bg-ink-800 grid place-items-center
                                   text-label font-semibold text-ink-300">
                        {{ t.initials }}
                      </span>
                      <span class="grid">
                        <span class="text-label font-semibold">{{ t.authorName }}</span>
                        <span class="text-[13px] text-ink-400">{{ t.vehicleLabel }}</span>
                      </span>
                    </figcaption>
                  </figure>
                }
              </div>
            </div>
          </section>
        }
      }

      <!-- CTA ASSISTENTE -->
      @defer (on idle) {
        @if (siteStore.homeContent()?.assistantCtaTitle) {
          <section class="pb-[72px]">
            <div class="max-w-[--container-page] mx-auto px-6">
              <div
                class="[container-type:inline-size] rounded-2xl p-[clamp(28px,6cqi,56px)]
                       bg-[radial-gradient(80%_120%_at_100%_0%,rgb(208_22_31_/_0.35),transparent_60%),#111114]
                       shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.08)]
                       flex flex-wrap gap-6 items-end justify-between"
              >
                <div class="grid gap-3 max-w-[560px]">
                  <h2 class="m-0 font-display font-bold
                             text-[clamp(26px,4.4cqi,40px)] leading-[1.02] tracking-[-0.03em] text-balance">
                    {{ siteStore.homeContent()!.assistantCtaTitle }}
                  </h2>
                  <p class="m-0 text-[16px] leading-relaxed text-ink-300">
                    {{ siteStore.homeContent()!.assistantCtaText }}
                  </p>
                </div>
                <button
                  type="button"
                  (click)="openAssistant()"
                  class="min-h-[52px] px-6 rounded-xl border-0 flex items-center gap-2.5
                         bg-red-500 hover:bg-red-600
                         text-white text-label font-semibold
                         focus:outline-none focus:ring-2 focus:ring-red-500/40
                         transition-colors"
                >
                  <svg viewBox="0 0 20 20" class="w-5 h-5" fill="none">
                    <path d="M2 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6l-4 2V6Z"
                          stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                  </svg>
                  {{ siteStore.homeContent()!.assistantCtaButton }}
                </button>
              </div>
            </div>
          </section>
        }
      }

      <pm-footer
        [nav]="siteStore.nav()"
        [settings]="siteStore.settings()"
      />
    </div>
  `,
})
export class SearchPage implements OnInit {
  protected readonly siteStore = inject(SiteStore);
  protected readonly searchStore = inject(SearchStore);
  private readonly favStore = inject(FavoritesStore);
  private readonly vehiclesApi = inject(VehiclesApi);
  private readonly siteApi = inject(SiteApi);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  protected readonly filterPanelOpen = signal(false);
  protected readonly featured = signal<VehicleListItem[]>([]);
  protected readonly emptySuggestions = signal<VehicleSuggestion[]>([]);
  protected readonly skeletons = Array(6);

  protected readonly countLabel = computed(() => {
    const t = this.searchStore.total();
    if (t === 0) return 'Sem resultados';
    return t === 1 ? '1 viatura' : `${t} viaturas`;
  });

  protected readonly activeChips = computed(() => {
    const f = this.searchStore.filters();
    const chips: { key: keyof ActiveFilters; label: string }[] = [];
    if (f.brand) chips.push({ key: 'brand', label: f.brand });
    if (f.model) chips.push({ key: 'model', label: f.model });
    if (f.fuel) chips.push({ key: 'fuel', label: f.fuel });
    if (f.bodyType) chips.push({ key: 'bodyType', label: f.bodyType });
    if (f.transmission) chips.push({ key: 'transmission', label: f.transmission });
    if (f.priceMax) chips.push({ key: 'priceMax', label: 'até ' + formatEur(f.priceMax) });
    if (f.yearMin) chips.push({ key: 'yearMin', label: 'a partir de ' + f.yearMin });
    if (f.kmMax) chips.push({ key: 'kmMax', label: 'até ' + formatKm(f.kmMax) });
    if (f.budget) chips.push({ key: 'budget', label: 'até ' + formatEur(f.budget) + '/mês' });
    return chips;
  });

  protected readonly brandList = computed(() => {
    const facets = this.searchStore.facets();
    return Object.keys(facets.fuel).length ? [] : [];
  });

  protected readonly modelList = computed(() => []);

  protected readonly fitCount = computed(() => {
    const vehicles = this.searchStore.vehicles();
    return vehicles.filter((v) => v.budgetStatus === 'FITS').length || null;
  });

  protected readonly nearCount = computed(() => {
    const vehicles = this.searchStore.vehicles();
    return vehicles.filter((v) => v.budgetStatus === 'NEAR').length || null;
  });

  constructor() {
    effect(() => {
      const content = this.siteStore.homeContent();
      const settings = this.siteStore.settings();
      if (!content) return;
      const name = settings?.companyName ?? 'Private Motors';
      const desc = content.heroSubtitle ?? 'Pesquise viaturas usadas por marca, modelo ou prestação mensal.';
      this.seo.set({
        title: `${name} — Stock de viaturas usadas`,
        description: desc,
        path: '/',
        image: settings?.logoUrl ?? null,
      });
      if (settings) {
        this.seo.setJsonLd({
          '@context': 'https://schema.org',
          '@type': 'AutoDealer',
          name: settings.companyName,
          url: 'https://privatemotors.pt',
          ...(settings.address ? {
            address: {
              '@type': 'PostalAddress',
              streetAddress: settings.address,
              postalCode: settings.postalCode,
              addressLocality: settings.locality,
              addressCountry: 'PT',
            },
          } : {}),
          ...(settings.phones?.length ? { telephone: settings.phones[0] } : {}),
          ...(settings.email ? { email: settings.email } : {}),
          ...(settings.googleRating ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: settings.googleRating,
              reviewCount: settings.googleReviewCount ?? undefined,
            },
          } : {}),
        });
      }
    });
  }

  ngOnInit() {
    this.siteStore.load(undefined);
    this.searchStore.init(this.route);
    this.favStore.init();
    this.loadFeatured();
    this.loadSuggestions();
  }

  private loadFeatured() {
    this.siteApi.getFeatured('HOME_FEATURED').pipe(
      catchError(() => EMPTY),
    ).subscribe((items) => {
      this.featured.set(items);
    });
  }

  private loadSuggestions() {
    if (this.searchStore.isEmpty()) {
      this.vehiclesApi.suggestions().pipe(
        catchError(() => EMPTY),
      ).subscribe((result) => {
        this.emptySuggestions.set(result.suggestions);
      });
    }
  }

  protected onQueryChange(q: string) {
    const dict = this.siteStore.parserDictionary();
    const brands = dict?.brands.map((b) => b.name) ?? [];
    const models = dict?.models.map((m) => ({ brand: m.brandSlug, model: m.name })) ?? [];
    this.searchStore.setQuery(q, brands, models);
  }

  protected onSearch(q: string) {
    const dict = this.siteStore.parserDictionary();
    const brands = dict?.brands.map((b) => b.name) ?? [];
    const models = dict?.models.map((m) => ({ brand: m.brandSlug, model: m.name })) ?? [];
    this.searchStore.setQuery(q, brands, models);
  }

  protected onQuickFilter(qf: QuickFilter) {
    for (const [k, v] of Object.entries(qf.filters)) {
      this.searchStore.setFilter(k as keyof ActiveFilters, v as string | number);
    }
  }

  protected onExample(text: string) {
    this.onSearch(text);
  }

  protected onSort(e: Event) {
    this.searchStore.setSort((e.target as HTMLSelectElement).value as SortKey);
  }

  protected onFilterChanged(event: { key: keyof ActiveFilters; value: string | number | undefined }) {
    if (event.value === undefined) {
      this.searchStore.removeFilter(event.key);
    } else {
      this.searchStore.setFilter(event.key, event.value);
    }
  }

  protected onSuggestion(s: VehicleSuggestion) {
    for (const [k, v] of Object.entries(s.filters)) {
      this.searchStore.setFilter(k as keyof ActiveFilters, v);
    }
  }

  protected openAssistant() {
    // Fase 7
  }
}
