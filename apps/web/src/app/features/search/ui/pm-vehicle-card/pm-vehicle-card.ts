import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import type { FinancingProduct } from '@pm/libs/contracts';
import { FinanceService } from '../../../../core/services/finance.service';
import { formatEur, formatKm } from '../../../../shared/util/format';
import type { VehicleListItem } from '../../data-access/vehicles.api';
import { FavoritesStore } from '../../data-access/favorites.store';
import { PmFinanceInline } from '../pm-finance-inline/pm-finance-inline';

export type CardVariant = 'default' | 'featured' | 'compact';

@Component({
  selector: 'pm-vehicle-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, PmFinanceInline],
  template: `
    @if (variant() === 'featured') {
      <!-- variante destaque: horizontal -->
      <article
        class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))]
               bg-ink-900 rounded-xl overflow-hidden shadow-card
               transition-shadow duration-300 hover:shadow-glow"
      >
        <a [routerLink]="['/viaturas', vehicle().slug]" class="block min-h-[240px] relative
           bg-[radial-gradient(120%_90%_at_40%_110%,#2b1113_0%,#0d0d10_70%)]">
          @if (vehicle().coverImage) {
            <img
              [ngSrc]="vehicle().coverImage!.variants.card"
              [alt]="vehicle().coverImage!.alt"
              [priority]="priority()"
              fill
              class="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          }
          <span class="absolute top-3.5 left-3.5 inline-flex items-center h-[26px] px-2.5
                       rounded-md bg-red-500 text-white text-[11px] font-semibold
                       tracking-[.06em] uppercase">
            Destaque
          </span>
        </a>
        <div class="p-6 grid gap-3.5 content-between">
          <div class="grid gap-1">
            <h3 class="font-display font-bold text-h3 tracking-tight leading-[1.1]">
              {{ vehicle().brand }} {{ vehicle().model }}
            </h3>
            <p class="text-caption text-ink-400 truncate">{{ vehicle().version }}</p>
            <p class="text-caption text-ink-300 mt-1.5 tabular-nums">
              {{ vehicle().year }} · {{ formatKm(vehicle().mileageKm) }} ·
              {{ vehicle().fuelLabel }}
              @if (vehicle().powerHp) { · {{ vehicle().powerHp }} cv }
            </p>
          </div>
          <div class="grid gap-1">
            <span class="text-label font-semibold tabular-nums">{{ formatEur(vehicle().priceCents) }}</span>
            @if (vehicle().monthlyFromCents) {
              <span class="text-body text-ink-300 tabular-nums">
                ou desde <strong class="text-white font-semibold">{{ formatEur(vehicle().monthlyFromCents!) }}/mês</strong>
              </span>
            }
          </div>
          <div class="flex gap-2 flex-wrap">
            <a
              [routerLink]="['/viaturas', vehicle().slug]"
              class="inline-flex items-center justify-center min-h-[touch] px-4 rounded-md
                     bg-red-500 hover:bg-red-600 text-white text-label font-semibold
                     transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
            >
              Ver viatura
            </a>
          </div>
        </div>
      </article>
    } @else if (variant() === 'compact') {
      <!-- variante compacta: para assistente -->
      <article
        class="bg-ink-900 rounded-lg overflow-hidden shadow-card flex gap-3 p-3
               transition-shadow duration-300 hover:shadow-glow"
      >
        <a [routerLink]="['/viaturas', vehicle().slug]"
           class="shrink-0 w-20 h-16 rounded-md overflow-hidden relative
                  bg-[radial-gradient(120%_90%_at_50%_110%,#26262c_0%,#0d0d10_70%)]">
          @if (vehicle().coverImage) {
            <img
              [ngSrc]="vehicle().coverImage!.variants.thumb"
              [alt]="vehicle().coverImage!.alt"
              [priority]="priority()"
              fill
              class="object-cover"
              sizes="80px"
            />
          }
        </a>
        <div class="flex-1 min-w-0 grid gap-0.5 content-center">
          <p class="font-display font-semibold text-[14px] leading-[1.2] truncate">
            {{ vehicle().brand }} {{ vehicle().model }}
          </p>
          <p class="text-caption text-ink-400 truncate">
            {{ vehicle().year }} · {{ formatKm(vehicle().mileageKm) }}
          </p>
          <p class="text-label tabular-nums">
            {{ formatEur(vehicle().priceCents) }}
            @if (vehicle().monthlyFromCents) {
              <span class="text-ink-400"> · {{ formatEur(vehicle().monthlyFromCents!) }}/mês</span>
            }
          </p>
        </div>
      </article>
    } @else {
      <!-- variante padrão (1a) -->
      <article
        class="bg-ink-900 rounded-lg overflow-hidden flex flex-col shadow-card
               transition-[box-shadow,transform] duration-300
               hover:shadow-glow hover:-translate-y-0.5"
      >
        <!-- imagem -->
        <a
          [routerLink]="['/viaturas', vehicle().slug]"
          class="relative block aspect-[16/10]
                 bg-[radial-gradient(120%_90%_at_50%_110%,#26262c_0%,#0d0d10_70%)]"
        >
          @if (vehicle().coverImage) {
            <img
              [ngSrc]="vehicle().coverImage!.variants.card"
              [alt]="vehicle().coverImage!.alt"
              [priority]="priority()"
              fill
              class="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          }
          <!-- badges -->
          <div class="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[75%]">
            @for (badge of badgeItems(); track badge.key) {
              <span [class]="badge.cls">{{ badge.label }}</span>
            }
          </div>
          <!-- favorito -->
          <button
            type="button"
            (click)="toggleFavorite($event)"
            [attr.aria-label]="isFavorite() ? 'Remover dos favoritos' : 'Guardar nos favoritos'"
            [attr.aria-pressed]="isFavorite()"
            class="absolute top-2 right-2 w-11 h-11 rounded-full flex items-center justify-center
                   bg-ink-950/60 backdrop-blur-sm text-ink-100 text-[19px]
                   hover:bg-ink-950/85 focus:outline-none focus:ring-2 focus:ring-red-500/60
                   transition-colors"
          >
            @if (isFavorite()) {
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-red-500" aria-hidden="true">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke-linejoin="round"/>
              </svg>
            }
          </button>
        </a>

        <!-- corpo do card -->
        <div class="p-4 grid gap-3.5 flex-1">
          <!-- título -->
          <a [routerLink]="['/viaturas', vehicle().slug]" class="grid gap-[3px] hover:no-underline">
            <h3 class="font-display font-semibold text-[18px] tracking-[-0.01em] leading-[1.2]">
              {{ vehicle().brand }} {{ vehicle().model }}
            </h3>
            <p class="text-[13px] text-ink-400 truncate">{{ vehicle().version }}</p>
          </a>

          <!-- meta -->
          <p class="text-[12.5px] text-ink-300 tabular-nums">
            {{ vehicle().year }} · {{ formatKm(vehicle().mileageKm) }} · {{ vehicle().fuelLabel }}
            @if (vehicle().transmission === 'AUTOMATIC') { · Auto }
          </p>

          <!-- preço + prestação -->
          <div class="flex items-end justify-between gap-3">
            <div class="grid gap-0.5">
              @if (vehicle().monthlyFromCents) {
                <span class="text-[12px] text-ink-400">desde</span>
                <span class="font-display font-bold text-[28px] leading-none tracking-[-0.025em] tabular-nums">
                  {{ formatEur(currentMonthly()) }}<span class="font-sans font-medium text-[14px] text-ink-300 tracking-normal">/mês</span>
                </span>
              } @else {
                <span class="font-display font-bold text-[28px] leading-none tracking-[-0.025em] tabular-nums">
                  {{ formatEur(vehicle().priceCents) }}
                </span>
              }
            </div>
            <div class="text-right grid gap-0.5">
              <span class="text-[12px] text-ink-400">Preço</span>
              <span class="text-label font-semibold tabular-nums">{{ formatEur(vehicle().priceCents) }}</span>
            </div>
          </div>

          <!-- budget diff (modo orçamento) -->
          @if (vehicle().budgetStatus) {
            <div [class]="budgetDiffClass()">
              @if (vehicle().budgetStatus === 'FITS') {
                <svg viewBox="0 0 16 16" class="w-4 h-4" fill="none">
                  <path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Sobram {{ formatEur(Math.abs(vehicle().budgetDiffCents ?? 0)) }}/mês
              } @else {
                <svg viewBox="0 0 16 16" class="w-4 h-4" fill="none">
                  <path d="M8 3v5m0 3v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Faltam {{ formatEur(Math.abs(vehicle().budgetDiffCents ?? 0)) }}/mês
              }
            </div>
          }

          <!-- botão gaveta -->
          @if (vehicle().financingEnabled && financingProduct()) {
            <button
              type="button"
              (click)="toggleDrawer()"
              [attr.aria-expanded]="drawerOpen()"
              class="min-h-[touch] flex items-center justify-between px-3.5 rounded-md
                     bg-ink-850 text-ink-100 text-label font-medium
                     shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.08)]
                     hover:bg-ink-800 focus:outline-none focus:ring-2 focus:ring-red-500/40
                     transition-colors"
            >
              <span class="flex items-center gap-2">
                <svg viewBox="0 0 16 16" class="w-4 h-4 text-red-400" fill="none">
                  <path d="M2 5h12M5 8h6M7 11h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                {{ drawerOpen() ? 'Fechar simulação' : 'Ajustar prestação' }}
              </span>
              <span class="flex items-center gap-1 text-ink-400 text-caption tabular-nums">
                {{ drawerSummary() }}
                <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 transition-transform duration-200"
                     [class.-rotate-180]="drawerOpen()" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>

            @if (drawerOpen()) {
              <pm-finance-inline
                [product]="financingProduct()!"
                [priceCents]="vehicle().priceCents"
                [downCentsValue]="downCents()"
                [termMonthsValue]="termMonths()"
                (downCents)="setDown($event)"
                (termMonths)="setTerm($event)"
              />
            }
          }
        </div>
      </article>
    }
  `,
})
export class PmVehicleCard {
  readonly vehicle = input.required<VehicleListItem>();
  readonly financingProduct = input<FinancingProduct | null>(null);
  readonly variant = input<CardVariant>('default');
  readonly priority = input<boolean>(false);

  private readonly favStore = inject(FavoritesStore);
  private readonly financeService = inject(FinanceService);

  protected readonly drawerOpen = signal(false);
  protected readonly downCents = signal(0);
  protected readonly termMonths = signal(96);

  protected readonly Math = Math;

  protected readonly isFavorite = computed(() => this.favStore.isFavorite(this.vehicle().id));

  protected readonly currentMonthly = computed(() => {
    const p = this.financingProduct();
    if (!p || !this.vehicle().financingEnabled) return this.vehicle().monthlyFromCents ?? 0;
    try {
      const sim = this.financeService.simulate(p, this.vehicle().priceCents, this.downCents(), this.termMonths());
      return sim.monthlyPaymentRounded;
    } catch {
      return this.vehicle().monthlyFromCents ?? 0;
    }
  });

  protected readonly badgeItems = computed(() => {
    return (this.vehicle().badges ?? []).map((b) => ({
      key: b,
      label: BADGE_LABELS[b] ?? b,
      cls: BADGE_CLASSES[b] ?? BADGE_CLASSES['DEFAULT'],
    }));
  });

  protected readonly drawerSummary = computed(() => {
    const d = this.downCents();
    const t = this.termMonths();
    return (d ? formatEur(d) + ' · ' : 'Sem entrada · ') + t + 'm';
  });

  protected readonly budgetDiffClass = computed(() => {
    const s = this.vehicle().budgetStatus;
    return [
      'flex items-center gap-1.5 text-[13px] font-medium tabular-nums',
      s === 'FITS' ? 'text-success' : 'text-warning',
    ].join(' ');
  });

  protected toggleFavorite(e: MouseEvent) {
    e.preventDefault();
    this.favStore.toggle(this.vehicle().id);
  }

  protected toggleDrawer() {
    this.drawerOpen.update((v) => !v);
    // inicializar prazo a partir do produto
    if (this.drawerOpen() && this.financingProduct()) {
      this.termMonths.set(this.financingProduct()!.defaultTermMonths);
    }
  }

  protected setDown(v: number) {
    this.downCents.set(v);
  }

  protected setTerm(v: number) {
    this.termMonths.set(v);
  }

  protected readonly formatEur = formatEur;
  protected readonly formatKm = formatKm;
}

const BADGE_LABELS: Record<string, string> = {
  NEW: 'Novo',
  PRICE_DROP: 'Baixa de preço',
  WARRANTY: 'Garantia',
  FEATURED: 'Destaque',
  RESERVED: 'Reservado',
};

const BADGE_CLASSES: Record<string, string> = {
  NEW: 'inline-flex items-center h-6 px-2.5 rounded-md bg-red-950/85 text-red-200 text-[11px] font-semibold tracking-[.02em] shadow-[inset_0_0_0_1px_#8c0f15] backdrop-blur-sm',
  PRICE_DROP: 'inline-flex items-center h-6 px-2.5 rounded-md bg-warning-bg/90 text-warning text-[11px] font-semibold tracking-[.02em] backdrop-blur-sm',
  WARRANTY: 'inline-flex items-center h-6 px-2.5 rounded-md bg-ink-950/70 text-ink-200 text-[11px] font-semibold tracking-[.02em] shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.14)] backdrop-blur-sm',
  FEATURED: 'inline-flex items-center h-6 px-2.5 rounded-md bg-red-500 text-white text-[11px] font-semibold tracking-[.06em] uppercase',
  RESERVED: 'inline-flex items-center h-6 px-2.5 rounded-md bg-ink-700 text-ink-200 text-[11px] font-semibold tracking-[.02em]',
  DEFAULT: 'inline-flex items-center h-6 px-2.5 rounded-md bg-ink-700 text-ink-200 text-[11px] font-semibold',
};
