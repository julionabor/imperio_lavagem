import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SeoService } from '../../core/services/seo.service';
import type { VehicleDetail, VehicleListItem } from '../search/data-access/vehicles.api';
import { VehiclesApi } from '../search/data-access/vehicles.api';
import { SiteStore } from '../search/data-access/site.store';
import { FinanceService } from '../../core/services/finance.service';
import { PmHeader } from '../../core/layout/pm-header/pm-header';
import { PmFooter } from '../../core/layout/pm-footer/pm-footer';
import { PmVehicleCard } from '../search/ui/pm-vehicle-card/pm-vehicle-card';
import { PmFinanceInline } from '../search/ui/pm-finance-inline/pm-finance-inline';
import { formatEur, formatKm } from '../../shared/util/format';

const FUEL_LABELS: Record<string, string> = {
  PETROL: 'Gasolina', DIESEL: 'Diesel', HYBRID: 'Híbrido',
  PHEV: 'Plug-in Híbrido', ELECTRIC: 'Elétrico', LPG: 'GPL',
};
const GEAR_LABELS: Record<string, string> = {
  MANUAL: 'Manual', AUTOMATIC: 'Automático',
};
const BODY_LABELS: Record<string, string> = {
  SUV: 'SUV', ESTATE: 'Carrinha', SEDAN: 'Berlina',
  CITY: 'Citadino', COUPE: 'Coupé', CABRIO: 'Cabrio', MPV: 'Monovolume', VAN: 'Comercial',
};

@Component({
  selector: 'pm-vehicle-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, RouterLink, PmHeader, PmFooter, PmVehicleCard, PmFinanceInline],
  template: `
    <pm-header
      [nav]="siteStore.nav()"
      [settings]="siteStore.settings()"
      (assistantOpened)="scrollToContact()"
    />

    <main class="min-h-screen bg-ink-950 text-white pb-20">
      <div class="max-w-[--container-page] mx-auto px-4 sm:px-6 pt-6">

        <!-- back -->
        <a routerLink="/"
           class="inline-flex items-center gap-1.5 text-ink-400 text-label no-underline
                  hover:text-white transition-colors mb-6">
          <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Voltar ao stock
        </a>

        <!-- loading -->
        @if (loading()) {
          <div class="grid lg:grid-cols-[1fr_360px] gap-8 animate-pulse">
            <div class="aspect-[16/9] rounded-xl bg-ink-800"></div>
            <div class="flex flex-col gap-4">
              <div class="h-8 rounded-lg bg-ink-800 w-3/4"></div>
              <div class="h-12 rounded-lg bg-ink-800 w-1/2"></div>
              <div class="h-40 rounded-xl bg-ink-800"></div>
            </div>
          </div>
        }

        <!-- error -->
        @if (error()) {
          <div class="flex flex-col items-center gap-4 py-24 text-center">
            <p class="text-h2 font-display font-bold text-ink-200">Viatura não encontrada</p>
            <p class="text-ink-400">{{ error() }}</p>
            <a routerLink="/"
               class="mt-2 px-5 py-2.5 rounded-lg bg-red-500 text-white text-label font-medium
                      no-underline hover:bg-red-600 transition-colors">
              Ver todo o stock
            </a>
          </div>
        }

        @if (vehicle(); as v) {
          <!-- mobile title -->
          <div class="lg:hidden mb-5">
            <p class="text-overline text-red-400 uppercase tracking-[.14em] mb-1">
              {{ v.brand }}
            </p>
            <h1 class="text-h1 font-display font-black leading-tight">
              {{ v.model }} <span class="font-normal text-ink-300">{{ v.version }}</span>
            </h1>
          </div>

          <!-- layout 2 colunas desktop -->
          <div class="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 lg:items-start">

            <!-- ── esquerda: galeria + specs ─────────────────────── -->
            <div class="flex flex-col gap-8">

              <!-- galeria -->
              <div>
                <div class="relative aspect-[16/10] rounded-xl overflow-hidden bg-ink-900
                            shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.07)]">
                  @if (currentImage(); as img) {
                    <img
                      [ngSrc]="img.variants.full"
                      [alt]="img.alt || (v.brand + ' ' + v.model)"
                      [priority]="true"
                      fill
                      class="object-cover"
                      sizes="(max-width: 1024px) 100vw, calc(100vw - 440px)"
                    />
                  } @else {
                    <div class="absolute inset-0 flex items-center justify-center text-ink-600">
                      <svg viewBox="0 0 48 48" class="w-16 h-16" fill="none">
                        <rect x="4" y="10" width="40" height="28" rx="4"
                              stroke="currentColor" stroke-width="2"/>
                        <circle cx="24" cy="24" r="7" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </div>
                  }
                  <!-- badge destaque -->
                  @if (v.isFeatured) {
                    <span class="absolute top-3 left-3 px-2.5 h-[26px] inline-flex items-center
                                 rounded-md bg-red-500 text-white text-[11px] font-semibold
                                 uppercase tracking-[.06em]">
                      Destaque
                    </span>
                  }
                  <!-- badge garantia -->
                  @if (v.warrantyMonths > 0) {
                    <span class="absolute top-3 right-3 px-2.5 h-[26px] inline-flex items-center
                                 rounded-md bg-ink-800/90 text-white text-[11px] font-medium
                                 backdrop-blur-sm">
                      Garantia {{ v.warrantyMonths }}m
                    </span>
                  }
                  <!-- setas carrossel -->
                  @if (v.images.length > 1) {
                    <button
                      type="button"
                      (click)="prevImg(v.images.length)"
                      aria-label="Foto anterior"
                      class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                             bg-black/50 text-white flex items-center justify-center
                             hover:bg-black/70 transition-colors backdrop-blur-sm">
                      <svg viewBox="0 0 20 20" class="w-5 h-5" fill="none">
                        <path d="M12 15l-5-5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      (click)="nextImg(v.images.length)"
                      aria-label="Próxima foto"
                      class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                             bg-black/50 text-white flex items-center justify-center
                             hover:bg-black/70 transition-colors backdrop-blur-sm">
                      <svg viewBox="0 0 20 20" class="w-5 h-5" fill="none">
                        <path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <!-- contador -->
                    <span class="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-0.5
                                 text-white text-xs backdrop-blur-sm">
                      {{ selectedImg() + 1 }} / {{ v.images.length }}
                    </span>
                  }
                </div>

                <!-- miniaturas -->
                @if (v.images.length > 1) {
                  <div class="flex gap-2 mt-2 overflow-x-auto pb-1">
                    @for (img of v.images; track img.id; let i = $index) {
                      <button
                        type="button"
                        (click)="selectedImg.set(i)"
                        class="shrink-0 w-16 h-12 rounded-md overflow-hidden relative border-2 transition-colors"
                        [class]="selectedImg() === i
                          ? 'border-red-500'
                          : 'border-transparent opacity-60 hover:opacity-100'"
                      >
                        <img
                          [ngSrc]="img.variants.thumb"
                          [alt]="img.alt"
                          fill
                          class="object-cover"
                          sizes="64px"
                        />
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- pills de specs principais -->
              <div class="flex flex-wrap gap-2">
                @for (spec of keySpecs(v); track spec.label) {
                  <span class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full
                               bg-ink-800 text-ink-200 text-label">
                    <span class="text-ink-500 text-[11px]">{{ spec.label }}</span>
                    {{ spec.value }}
                  </span>
                }
              </div>

              <!-- specs técnicas -->
              <section>
                <h2 class="text-h3 font-display font-bold mb-4">Características</h2>
                <dl class="grid grid-cols-2 sm:grid-cols-3 gap-px bg-ink-800 rounded-xl
                           overflow-hidden border border-ink-800">
                  @for (s of techSpecs(v); track s.label) {
                    <div class="bg-ink-900 px-4 py-3">
                      <dt class="text-caption text-ink-500 mb-0.5">{{ s.label }}</dt>
                      <dd class="text-label font-medium text-ink-100">{{ s.value }}</dd>
                    </div>
                  }
                </dl>
              </section>

              <!-- descrição -->
              @if (v.description) {
                <section>
                  <h2 class="text-h3 font-display font-bold mb-3">Descrição</h2>
                  <p class="text-body text-ink-300 leading-relaxed whitespace-pre-line">
                    {{ v.description }}
                  </p>
                </section>
              }

              <!-- equipamento -->
              @if (v.equipment.length > 0) {
                <section>
                  <h2 class="text-h3 font-display font-bold mb-3">Equipamento</h2>
                  <ul class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                    @for (eq of v.equipment; track eq.name) {
                      <li class="flex items-center gap-2 text-label text-ink-300">
                        <span class="w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                        {{ eq.name }}
                      </li>
                    }
                  </ul>
                </section>
              }
            </div>

            <!-- ── direita: preço + financiamento + contacto ───── -->
            <aside class="lg:sticky lg:top-[84px] self-start mt-8 lg:mt-0 flex flex-col gap-5">

              <!-- título desktop -->
              <div class="hidden lg:block">
                <p class="text-overline text-red-400 uppercase tracking-[.14em] mb-1">
                  {{ v.brand }}
                </p>
                <h1 class="text-h2 font-display font-black leading-tight">
                  {{ v.model }}
                  <span class="block text-body-lg font-normal text-ink-300 mt-0.5">
                    {{ v.version }}
                  </span>
                </h1>
              </div>

              <!-- price box -->
              <div class="rounded-xl bg-ink-900 shadow-card p-5 flex flex-col gap-4">
                <!-- preço -->
                <div>
                  @if (v.previousPriceCents) {
                    <p class="text-label text-ink-500 line-through tabular-nums">
                      {{ formatEur(v.previousPriceCents) }}
                    </p>
                  }
                  <p class="text-price-xl font-display font-black tabular-nums leading-none">
                    {{ formatEur(v.priceCents) }}
                  </p>
                  @if (v.vatDeductible) {
                    <p class="text-caption text-ink-500 mt-0.5">IVA dedutível</p>
                  }
                </div>

                <!-- desde X€/mês -->
                @if (v.financingEnabled && v.monthlyFromCents) {
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-ink-400 text-label">desde</span>
                    <span class="text-h3 font-display font-bold tabular-nums text-white">
                      {{ formatEur(v.monthlyFromCents) }}/mês
                    </span>
                  </div>
                }

                <!-- toggle simulador -->
                @if (v.financingEnabled && siteStore.financingProduct()) {
                  <button
                    type="button"
                    (click)="financeOpen.update(x => !x)"
                    class="flex items-center justify-between w-full text-label text-ink-300
                           hover:text-white transition-colors py-1"
                  >
                    Simular financiamento
                    <svg viewBox="0 0 20 20" class="w-4 h-4 transition-transform"
                         [class.rotate-180]="financeOpen()" fill="none">
                      <path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="1.5"
                            stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>

                  @if (financeOpen()) {
                    <pm-finance-inline
                      [product]="siteStore.financingProduct()!"
                      [priceCents]="v.priceCents"
                      [downCentsValue]="down()"
                      [termMonthsValue]="term()"
                      (downCents)="down.set($event)"
                      (termMonths)="term.set($event)"
                    />
                  }
                }

                <!-- CTA principal -->
                <button
                  type="button"
                  (click)="contactOpen.set(true); scrollToContact()"
                  class="w-full min-h-[48px] rounded-xl bg-red-500 text-white font-semibold
                         text-label hover:bg-red-600 active:scale-[.98] transition-all"
                >
                  Pedir informação
                </button>

                <!-- telefone -->
                @if (siteStore.settings()?.phones?.length) {
                  <a
                    [href]="'tel:' + siteStore.settings()!.phones[0].replace(/\\s/g, '')"
                    class="w-full min-h-[44px] rounded-xl border border-ink-700 flex items-center
                           justify-center gap-2 text-label text-ink-300 no-underline
                           hover:border-ink-500 hover:text-white transition-colors"
                  >
                    <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
                      <path d="M3 5a2 2 0 0 1 2-2h1.5a1 1 0 0 1 .95.68l.95 2.86a1 1 0 0 1-.23 1.03
                               L7 8.7c1.07 1.94 2.36 3.23 4.3 4.3l1.13-1.17a1 1 0 0 1 1.03-.23
                               l2.86.95A1 1 0 0 1 17 13.5V15a2 2 0 0 1-2 2h-.5C7.3 17 3 12.7 3 7.5V5Z"
                            stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                    </svg>
                    {{ siteStore.settings()!.phones[0] }}
                  </a>
                }
              </div>

              <!-- formulário de contacto -->
              <div #contactSection id="contact">
                @if (!leadDone()) {
                  @if (contactOpen()) {
                    <form
                      (submit)="submitLead($event, v.slug)"
                      class="rounded-xl bg-ink-900 shadow-card p-5 flex flex-col gap-3"
                    >
                      <h3 class="text-label font-semibold text-white">
                        Enviar mensagem sobre esta viatura
                      </h3>

                      <div class="flex flex-col gap-1">
                        <label class="text-caption text-ink-400">Nome *</label>
                        <input
                          type="text"
                          [value]="leadName()"
                          (input)="leadName.set(asStr($event))"
                          placeholder="O seu nome"
                          required
                          class="w-full h-10 px-3 rounded-lg bg-ink-800 border border-ink-700
                                 text-label text-white placeholder-ink-600
                                 focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>

                      <div class="flex flex-col gap-1">
                        <label class="text-caption text-ink-400">Telemóvel *</label>
                        <input
                          type="tel"
                          [value]="leadPhone()"
                          (input)="leadPhone.set(asStr($event))"
                          placeholder="+351 9XX XXX XXX"
                          required
                          class="w-full h-10 px-3 rounded-lg bg-ink-800 border border-ink-700
                                 text-label text-white placeholder-ink-600
                                 focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>

                      <div class="flex flex-col gap-1">
                        <label class="text-caption text-ink-400">Mensagem (opcional)</label>
                        <textarea
                          rows="3"
                          [value]="leadMessage()"
                          (input)="leadMessage.set(asStr($event))"
                          placeholder="Tenho interesse nesta viatura..."
                          class="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700
                                 text-label text-white placeholder-ink-600 resize-none
                                 focus:outline-none focus:border-red-500 transition-colors"
                        ></textarea>
                      </div>

                      <!-- honeypot -->
                      <input type="text" name="website" style="display:none"
                             [value]="honeypot()" (input)="honeypot.set(asStr($event))"/>

                      @if (leadError()) {
                        <p class="text-caption text-error">{{ leadError() }}</p>
                      }

                      <button
                        type="submit"
                        [disabled]="leadSubmitting()"
                        class="w-full min-h-[44px] rounded-xl bg-red-500 text-white font-semibold
                               text-label hover:bg-red-600 disabled:opacity-50
                               active:scale-[.98] transition-all"
                      >
                        {{ leadSubmitting() ? 'A enviar...' : 'Enviar' }}
                      </button>
                    </form>
                  }
                } @else {
                  <div class="rounded-xl bg-success-bg border border-success/20 p-5 text-center">
                    <p class="text-success font-semibold mb-1">Mensagem enviada!</p>
                    <p class="text-caption text-ink-400">
                      Entraremos em contacto brevemente.
                    </p>
                  </div>
                }
              </div>
            </aside>
          </div>

          <!-- viaturas semelhantes -->
          @if (similar().length > 0) {
            <section class="mt-16">
              <h2 class="text-h2 font-display font-bold mb-6">Viaturas semelhantes</h2>
              <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
                @for (s of similar(); track s.id) {
                  <pm-vehicle-card
                    [vehicle]="s"
                    [financingProduct]="siteStore.financingProduct()"
                  />
                }
              </div>
            </section>
          }
        }
      </div>
    </main>

    <pm-footer [settings]="siteStore.settings()" />
  `,
})
export class VehicleDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly vehiclesApi = inject(VehiclesApi);
  private readonly http = inject(HttpClient);
  private readonly seo = inject(SeoService);

  private readonly platformId = inject(PLATFORM_ID);

  protected readonly siteStore = inject(SiteStore);
  protected readonly financeService = inject(FinanceService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly vehicle = signal<VehicleDetail | null>(null);
  protected readonly similar = signal<VehicleListItem[]>([]);

  protected readonly selectedImg = signal(0);
  protected readonly financeOpen = signal(false);
  protected readonly contactOpen = signal(false);

  protected readonly down = signal(0);
  protected readonly term = signal(96);

  protected readonly leadName = signal('');
  protected readonly leadPhone = signal('');
  protected readonly leadMessage = signal('');
  protected readonly honeypot = signal('');
  protected readonly leadSubmitting = signal(false);
  protected readonly leadDone = signal(false);
  protected readonly leadError = signal<string | null>(null);

  protected readonly currentImage = computed(() => {
    const v = this.vehicle();
    if (!v || v.images.length === 0) return null;
    return v.images[this.selectedImg()] ?? v.images[0];
  });

  protected prevImg(total: number) {
    this.selectedImg.update((i) => (i - 1 + total) % total);
  }

  protected nextImg(total: number) {
    this.selectedImg.update((i) => (i + 1) % total);
  }

  protected readonly formatEur = formatEur;
  protected readonly formatKm = formatKm;

  ngOnInit() {
    this.siteStore.load();
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.term.set(this.siteStore.financingProduct()?.defaultTermMonths ?? 96);

    this.vehiclesApi.getBySlug(slug).subscribe({
      next: (v) => {
        this.vehicle.set(v);
        this.loading.set(false);
        const title = v.seoTitle ?? `${v.brand} ${v.model} ${v.version} (${v.year}) | Private Motors`;
        const description = v.seoDescription ?? `${v.brand} ${v.model} ${v.version}, ${v.year}, ${v.mileageKm.toLocaleString('pt-PT')} km — Private Motors`;
        const image = v.images[0]?.variants.full ?? null;
        this.seo.set({ title, description, path: `/viaturas/${v.slug}`, image, type: 'website' });
        this.seo.setJsonLd({
          '@context': 'https://schema.org',
          '@type': 'Car',
          name: `${v.brand} ${v.model} ${v.version}`,
          description,
          image: image ? [image] : undefined,
          brand: { '@type': 'Brand', name: v.brand },
          model: v.model,
          modelDate: String(v.year),
          mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.mileageKm, unitCode: 'KMT' },
          fuelType: v.fuel,
          vehicleTransmission: v.transmission,
          ...(v.powerHp ? { vehicleEngine: { '@type': 'EngineSpecification', enginePower: { '@type': 'QuantitativeValue', value: v.powerHp, unitCode: 'BHP' } } } : {}),
          offers: {
            '@type': 'Offer',
            priceCurrency: 'EUR',
            price: (v.priceCents / 100).toFixed(2),
            availability: 'https://schema.org/InStock',
            url: `https://privatemotors.pt/viaturas/${v.slug}`,
          },
        });
      },
      error: () => {
        this.error.set('Não foi possível carregar os dados da viatura.');
        this.loading.set(false);
      },
    });

    this.vehiclesApi.getSimilar(slug).subscribe({
      next: (list) => this.similar.set(list),
      error: () => {},
    });
  }

  protected keySpecs(v: VehicleDetail) {
    return [
      { label: 'Ano',        value: String(v.year) },
      { label: 'Km',         value: this.formatKm(v.mileageKm) },
      { label: 'Combustível', value: FUEL_LABELS[v.fuel] ?? v.fuel },
      { label: 'Caixa',      value: GEAR_LABELS[v.transmission] ?? v.transmission },
      ...(v.powerHp ? [{ label: 'Potência', value: `${v.powerHp} cv` }] : []),
    ];
  }

  protected techSpecs(v: VehicleDetail) {
    const specs: { label: string; value: string }[] = [
      { label: 'Carroceria',   value: BODY_LABELS[v.bodyType] ?? v.bodyType },
      { label: 'Combustível',  value: FUEL_LABELS[v.fuel] ?? v.fuel },
      { label: 'Transmissão',  value: GEAR_LABELS[v.transmission] ?? v.transmission },
      { label: 'Ano',          value: String(v.year) },
      { label: 'Quilómetros',  value: this.formatKm(v.mileageKm) },
    ];
    if (v.powerHp)       specs.push({ label: 'Potência',    value: `${v.powerHp} cv` });
    if (v.engineCc)      specs.push({ label: 'Cilindrada',  value: `${v.engineCc} cc` });
    if (v.doors)         specs.push({ label: 'Portas',      value: String(v.doors) });
    if (v.seats)         specs.push({ label: 'Lugares',     value: String(v.seats) });
    if (v.color)         specs.push({ label: 'Cor',         value: v.color });
    if (v.colorInterior) specs.push({ label: 'Interior',    value: v.colorInterior });
    if (v.batteryKwh)    specs.push({ label: 'Bateria',     value: `${v.batteryKwh} kWh` });
    if (v.rangeKm)       specs.push({ label: 'Autonomia',   value: `${v.rangeKm} km` });
    if (v.warrantyMonths > 0) specs.push({ label: 'Garantia', value: `${v.warrantyMonths} meses` });
    return specs;
  }

  protected asStr(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected scrollToContact() {
    this.contactOpen.set(true);
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }

  protected submitLead(e: Event, vehicleSlug: string) {
    e.preventDefault();
    if (this.honeypot()) return;
    this.leadSubmitting.set(true);
    this.leadError.set(null);

    this.http.post('/api/v1/public/leads', {
      vehicleSlug,
      name: this.leadName(),
      phone: this.leadPhone(),
      message: this.leadMessage() || undefined,
      website: '',
    }).subscribe({
      next: () => {
        this.leadDone.set(true);
        this.leadSubmitting.set(false);
      },
      error: (err) => {
        this.leadError.set(err?.detail ?? 'Erro ao enviar. Tente novamente.');
        this.leadSubmitting.set(false);
      },
    });
  }
}
