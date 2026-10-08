import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { VehiclesAdminStore } from './vehicles-admin.store';
import { CatalogStore } from '../catalog/catalog.store';
import { PmButton } from '../../shared/ui/pm-button/pm-button';
import { PmInput } from '../../shared/ui/pm-input/pm-input';
import { PmBadge } from '../../shared/ui/pm-badge/pm-badge';
import { PmUploader } from '../../shared/ui/pm-uploader/pm-uploader';
import { ConfirmDialogService } from '../../shared/ui/pm-confirm-dialog/pm-confirm-dialog';
import { ToastService } from '../../shared/ui/pm-toast/pm-toast';
import { formatEur } from '../../shared/util/format';
import type { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import type { VehicleStatus } from './vehicles-admin.api';

type Tab = 'dados' | 'preco' | 'equipamento' | 'fotos' | 'financiamento' | 'seo';

@Component({
  selector: 'pm-vehicle-form-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [VehiclesAdminStore, CatalogStore],
  imports: [
    RouterLink, ReactiveFormsModule,
    CdkDropList, CdkDrag,
    PmButton, PmInput, PmBadge, PmUploader,
  ],
  template: `
    <div class="mx-auto max-w-4xl">
      <!-- Cabeçalho -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <a routerLink="/admin/viaturas" class="text-ink-400 hover:text-ink-200">←</a>
          <h1 class="font-display text-h2 font-semibold text-ink-100">
            {{ isNew() ? 'Nova viatura' : (store.current()?.title ?? 'Editar viatura') }}
          </h1>
          @if (!isNew() && store.current()) {
            <pm-badge [variant]="statusVariant()">{{ statusLabel() }}</pm-badge>
          }
        </div>
        <div class="flex gap-2">
          @if (!isNew() && store.current()?.status === 'DRAFT') {
            <pm-button variant="secondary" size="sm" [loading]="store.saving()" (click)="onSave()">
              Guardar rascunho
            </pm-button>
            <pm-button size="sm" [loading]="store.saving()" (click)="onPublish()">
              Publicar
            </pm-button>
          } @else {
            <pm-button variant="secondary" size="sm" [loading]="store.saving()" (click)="onSave()">
              Guardar
            </pm-button>
          }
        </div>
      </div>

      <!-- Autosave indicator -->
      @if (store.dirty()) {
        <p class="mb-4 text-xs text-ink-500">● Alterações não guardadas</p>
      }

      <!-- Tabs -->
      <div class="mb-6 flex gap-1 border-b border-ink-800">
        @for (tab of tabs; track tab.id) {
          <button
            (click)="activeTab.set(tab.id)"
            class="px-4 py-2 text-sm transition-colors border-b-2 -mb-px"
            [class.border-red-400]="activeTab() === tab.id"
            [class.text-ink-100]="activeTab() === tab.id"
            [class.border-transparent]="activeTab() !== tab.id"
            [class.text-ink-400]="activeTab() !== tab.id"
          >{{ tab.label }}</button>
        }
      </div>

      <form [formGroup]="form" (ngSubmit)="onSave()">
        <!-- Tab: Dados gerais -->
        @if (activeTab() === 'dados') {
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-ink-300">Condição</label>
              <div class="flex gap-2">
                @for (c of conditions; track c.value) {
                  <button
                    type="button"
                    (click)="setField('condition', c.value)"
                    class="rounded-lg border px-3 py-2 text-sm transition-colors"
                    [class.border-red-400]="form.get('condition')?.value === c.value"
                    [class.text-red-400]="form.get('condition')?.value === c.value"
                    [class.border-ink-700]="form.get('condition')?.value !== c.value"
                    [class.text-ink-400]="form.get('condition')?.value !== c.value"
                  >{{ c.label }}</button>
                }
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Marca *</label>
              <select formControlName="brandId" (change)="onBrandChange()" class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none">
                <option value="">Selecionar marca</option>
                @for (b of catalogStore.brands(); track b.id) {
                  <option [value]="b.id">{{ b.name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Modelo *</label>
              <select formControlName="modelId" class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none" [disabled]="!form.get('brandId')?.value">
                <option value="">Selecionar modelo</option>
                @for (m of filteredModels(); track m.id) {
                  <option [value]="m.id">{{ m.name }}</option>
                }
              </select>
            </div>

            <pm-input label="Versão *" formControlName="version" placeholder="ex.: 1.5 BlueHDi GT Line EAT8" />
            <pm-input label="Data de registo (AAAA-MM)" formControlName="registrationDate" placeholder="2022-06" />
            <pm-input label="Quilómetros *" type="number" formControlName="mileageKm" placeholder="0" />

            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Combustível *</label>
              <select formControlName="fuel" class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none">
                @for (f of fuels; track f.value) {
                  <option [value]="f.value">{{ f.label }}</option>
                }
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Caixa *</label>
              <select formControlName="transmission" class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none">
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATIC">Automática</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Carroçaria *</label>
              <select formControlName="bodyType" class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none">
                @for (b of bodyTypes; track b.value) {
                  <option [value]="b.value">{{ b.label }}</option>
                }
              </select>
            </div>

            <pm-input label="Potência (cv)" type="number" formControlName="powerHp" placeholder="130" />
            <pm-input label="Cilindrada (cc)" type="number" formControlName="engineCc" placeholder="1499" />
            <pm-input label="Portas" type="number" formControlName="doors" placeholder="5" />
            <pm-input label="Lugares" type="number" formControlName="seats" placeholder="5" />
            <pm-input label="Cor exterior" formControlName="color" placeholder="Branco Polar" />
            <pm-input label="Cor interior" formControlName="colorInterior" placeholder="Preto" />

            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-ink-300">Descrição</label>
              <textarea
                formControlName="description"
                rows="5"
                placeholder="Descrição da viatura em Markdown…"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:border-red-400 focus:outline-none resize-y"
              ></textarea>
            </div>
          </div>
        }

        <!-- Tab: Preço e garantia -->
        @if (activeTab() === 'preco') {
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Preço de venda (€) *</label>
              <input
                type="number"
                formControlName="priceEur"
                placeholder="24900"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none"
              />
              <p class="mt-1 text-xs text-ink-500">{{ form.get('priceEur')?.value ? formatEur(+form.get('priceEur')!.value * 100) : '' }}</p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Preço anterior (€)</label>
              <input
                type="number"
                formControlName="previousPriceEur"
                placeholder="Deixar vazio se sem desconto"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none"
              />
            </div>

            <div class="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3">
              <input type="checkbox" id="vatDeductible" formControlName="vatDeductible" class="h-4 w-4 accent-red-500" />
              <label for="vatDeductible" class="text-sm text-ink-200">IVA dedutível</label>
            </div>

            <pm-input label="Meses de garantia" type="number" formControlName="warrantyMonths" placeholder="12" />
          </div>
        }

        <!-- Tab: Equipamento -->
        @if (activeTab() === 'equipamento') {
          <div class="space-y-4">
            <input
              type="search"
              [(ngModel)]="equipmentSearch"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Pesquisar equipamento…"
              class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:border-red-400 focus:outline-none"
            />
            @for (cat of equipmentCategories; track cat.value) {
              <div>
                <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{{ cat.label }}</h3>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  @for (item of filteredEquipment(cat.value); track item.id) {
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="selectedEquipment().has(item.id)"
                        (change)="toggleEquipment(item.id)"
                        class="h-4 w-4 accent-red-500"
                      />
                      <span class="text-sm text-ink-300">{{ item.name }}</span>
                    </label>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Tab: Fotos -->
        @if (activeTab() === 'fotos') {
          <div class="space-y-4">
            @if (!isNew()) {
              <pm-uploader (filesSelected)="onUpload($event)" />

              <div
                cdkDropList
                (cdkDropListDropped)="onPhotoDrop($event)"
                class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              >
                @for (img of store.current()?.images ?? []; track img.id; let i = $index) {
                  <div cdkDrag class="group relative rounded-xl overflow-hidden border border-ink-800 cursor-grab active:cursor-grabbing">
                    <img [src]="img.variants.card" [alt]="img.alt ?? ''" class="aspect-video w-full object-cover" />
                    @if (img.isCover) {
                      <span class="absolute top-1 left-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">Capa</span>
                    }
                    <div class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 gap-1">
                      @if (!img.isCover) {
                        <button type="button" (click)="onSetCover(img.id)" class="rounded bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30">Definir capa</button>
                      }
                      <input
                        type="text"
                        [value]="img.alt ?? ''"
                        placeholder="Texto alternativo"
                        (change)="onUpdateAlt(img.id, $any($event.target).value)"
                        (click)="$event.stopPropagation()"
                        class="rounded bg-black/50 px-2 py-1 text-xs text-white placeholder-white/50 focus:outline-none"
                      />
                      <button type="button" (click)="onDeleteImage(img.id)" class="rounded bg-error/80 px-2 py-1 text-xs text-white hover:bg-error">Eliminar</button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="rounded-xl border border-dashed border-ink-700 bg-ink-900 p-8 text-center text-sm text-ink-400">
                Guarda a viatura primeiro para poder carregar fotos.
              </div>
            }
          </div>
        }

        <!-- Tab: Financiamento -->
        @if (activeTab() === 'financiamento') {
          <div class="space-y-4">
            <div class="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 px-4 py-3">
              <input type="checkbox" id="financingEnabled" formControlName="financingEnabled" class="h-4 w-4 accent-red-500" />
              <label for="financingEnabled" class="text-sm text-ink-200">Mostrar simulação de financiamento nesta viatura</label>
            </div>

            @if (form.get('financingEnabled')?.value) {
              <div>
                <label class="mb-1 block text-sm font-medium text-ink-300">Produto de financiamento</label>
                <select formControlName="financingProductId" class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none">
                  <option value="">Usar produto padrão</option>
                  @for (p of catalogStore.financingProducts(); track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </select>
              </div>
            }
          </div>
        }

        <!-- Tab: SEO -->
        @if (activeTab() === 'seo') {
          <div class="space-y-4">
            <pm-input label="Título SEO" formControlName="seoTitle" placeholder="Deixar vazio para gerar automaticamente" />
            <div>
              <label class="mb-1 block text-sm font-medium text-ink-300">Descrição SEO</label>
              <textarea
                formControlName="seoDescription"
                rows="3"
                placeholder="Deixar vazio para gerar automaticamente"
                class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:border-red-400 focus:outline-none resize-y"
              ></textarea>
            </div>
            @if (store.current()?.slug) {
              <p class="text-xs text-ink-500">Slug: <code class="text-ink-300">{{ store.current()?.slug }}</code></p>
            }
          </div>
        }
      </form>
    </div>
  `,
})
export class VehicleFormPage implements OnInit, OnDestroy, HasUnsavedChanges {
  protected readonly store = inject(VehiclesAdminStore);
  protected readonly catalogStore = inject(CatalogStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  protected readonly activeTab = signal<Tab>('dados');
  protected readonly equipmentSearch = signal('');
  protected readonly selectedEquipment = signal(new Set<string>());
  protected readonly formatEur = formatEur;

  protected readonly isNew = computed(() => !this.route.snapshot.paramMap.get('id'));
  private autosaveTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly tabs: Array<{ id: Tab; label: string }> = [
    { id: 'dados', label: 'Dados gerais' },
    { id: 'preco', label: 'Preço e garantia' },
    { id: 'equipamento', label: 'Equipamento' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'financiamento', label: 'Financiamento' },
    { id: 'seo', label: 'SEO' },
  ];

  protected readonly conditions = [
    { value: 'USED', label: 'Usado' },
    { value: 'NEARLY_NEW', label: 'Km zero' },
    { value: 'NEW', label: 'Novo' },
  ];

  protected readonly fuels = [
    { value: 'DIESEL', label: 'Diesel' },
    { value: 'PETROL', label: 'Gasolina' },
    { value: 'HYBRID', label: 'Híbrido' },
    { value: 'PHEV', label: 'Plug-in' },
    { value: 'ELECTRIC', label: 'Elétrico' },
    { value: 'LPG', label: 'GPL' },
  ];

  protected readonly bodyTypes = [
    { value: 'SUV', label: 'SUV' },
    { value: 'ESTATE', label: 'Carrinha' },
    { value: 'SEDAN', label: 'Berlina' },
    { value: 'CITY', label: 'Utilitário' },
    { value: 'COUPE', label: 'Coupé' },
    { value: 'CABRIO', label: 'Cabrio' },
    { value: 'MPV', label: 'MPV' },
    { value: 'VAN', label: 'Furgão' },
  ];

  protected readonly equipmentCategories = [
    { value: 'SAFETY', label: 'Segurança' },
    { value: 'COMFORT', label: 'Conforto' },
    { value: 'MULTIMEDIA', label: 'Multimédia' },
    { value: 'EXTERIOR', label: 'Exterior' },
    { value: 'INTERIOR', label: 'Interior' },
    { value: 'DRIVING', label: 'Condução' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    condition: ['USED', Validators.required],
    brandId: ['', Validators.required],
    modelId: ['', Validators.required],
    version: ['', [Validators.required, Validators.maxLength(120)]],
    registrationDate: ['', Validators.required],
    mileageKm: [0, [Validators.required, Validators.min(0)]],
    fuel: ['DIESEL', Validators.required],
    transmission: ['MANUAL', Validators.required],
    bodyType: ['SUV', Validators.required],
    powerHp: [null as number | null],
    engineCc: [null as number | null],
    doors: [null as number | null],
    seats: [null as number | null],
    batteryKwh: [null as number | null],
    rangeKm: [null as number | null],
    color: [''],
    colorInterior: [''],
    description: [''],
    priceEur: [null as number | null, [Validators.required, Validators.min(1)]],
    previousPriceEur: [null as number | null],
    vatDeductible: [false],
    warrantyMonths: [12],
    financingEnabled: [true],
    financingProductId: [''],
    seoTitle: [''],
    seoDescription: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.catalogStore.loadAll();

    if (id) {
      this.store.loadVehicle(id).then(() => {
        const v = this.store.current();
        if (v) this.patchForm(v);
      });
    }

    this.form.valueChanges.subscribe(() => this.store.markDirty());

    // Autosave a cada 30 s se tiver id
    this.autosaveTimer = setInterval(() => {
      if (this.store.dirty() && !this.isNew()) this.onSave();
    }, 30_000);
  }

  ngOnDestroy(): void {
    if (this.autosaveTimer) clearInterval(this.autosaveTimer);
  }

  hasUnsavedChanges(): boolean { return this.store.dirty(); }

  private patchForm(v: ReturnType<typeof this.store.current>): void {
    if (!v) return;
    this.form.patchValue({
      condition: v.condition,
      brandId: v.brandId,
      modelId: v.modelId,
      version: v.version,
      registrationDate: v.registrationDate,
      mileageKm: v.mileageKm,
      fuel: v.fuel,
      transmission: v.transmission,
      bodyType: v.bodyType,
      powerHp: v.powerHp,
      engineCc: v.engineCc,
      doors: v.doors,
      seats: v.seats,
      batteryKwh: v.batteryKwh,
      rangeKm: v.rangeKm,
      color: v.color ?? '',
      colorInterior: v.colorInterior ?? '',
      description: v.description ?? '',
      priceEur: v.priceCents / 100,
      previousPriceEur: v.previousPriceCents ? v.previousPriceCents / 100 : null,
      vatDeductible: v.vatDeductible,
      warrantyMonths: v.warrantyMonths,
      financingEnabled: v.financingEnabled,
      financingProductId: v.financingProductId ?? '',
      seoTitle: v.seoTitle ?? '',
      seoDescription: v.seoDescription ?? '',
    }, { emitEvent: false });
    this.selectedEquipment.set(new Set(v.equipment));
  }

  protected setField(field: string, value: unknown): void {
    this.form.get(field)?.setValue(value as never);
  }

  protected onBrandChange(): void {
    this.form.get('modelId')?.reset('');
  }

  protected filteredModels() {
    const brandId = this.form.get('brandId')?.value;
    return this.catalogStore.models().filter((m) => m.brandId === brandId);
  }

  protected filteredEquipment(category: string) {
    const q = this.equipmentSearch().toLowerCase();
    return this.catalogStore.equipmentItems()
      .filter((e) => e.category === category && (!q || e.name.toLowerCase().includes(q)));
  }

  protected toggleEquipment(id: string): void {
    this.selectedEquipment.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    this.store.markDirty();
  }

  protected statusLabel(): string {
    const labels: Record<string, string> = {
      DRAFT: 'Rascunho', PUBLISHED: 'Publicada', RESERVED: 'Reservada', SOLD: 'Vendida', ARCHIVED: 'Arquivada',
    };
    return labels[this.store.current()?.status ?? ''] ?? '';
  }

  protected statusVariant() {
    const map: Record<string, 'success' | 'warning' | 'neutral' | 'info' | 'error'> = {
      DRAFT: 'neutral', PUBLISHED: 'success', RESERVED: 'warning', SOLD: 'info', ARCHIVED: 'error',
    };
    return map[this.store.current()?.status ?? ''] ?? 'neutral';
  }

  protected buildPayload() {
    const v = this.form.getRawValue();
    return {
      condition: v.condition,
      brandId: v.brandId,
      modelId: v.modelId,
      version: v.version,
      registrationDate: v.registrationDate,
      mileageKm: Number(v.mileageKm),
      fuel: v.fuel,
      transmission: v.transmission,
      bodyType: v.bodyType,
      powerHp: v.powerHp ? Number(v.powerHp) : null,
      engineCc: v.engineCc ? Number(v.engineCc) : null,
      doors: v.doors ? Number(v.doors) : null,
      seats: v.seats ? Number(v.seats) : null,
      batteryKwh: v.batteryKwh ? Number(v.batteryKwh) : null,
      rangeKm: v.rangeKm ? Number(v.rangeKm) : null,
      color: v.color || null,
      colorInterior: v.colorInterior || null,
      description: v.description || null,
      priceCents: Math.round(Number(v.priceEur) * 100),
      previousPriceCents: v.previousPriceEur ? Math.round(Number(v.previousPriceEur) * 100) : null,
      vatDeductible: v.vatDeductible,
      warrantyMonths: Number(v.warrantyMonths),
      financingEnabled: v.financingEnabled,
      financingProductId: v.financingProductId || null,
      seoTitle: v.seoTitle || null,
      seoDescription: v.seoDescription || null,
      equipment: Array.from(this.selectedEquipment()),
    };
  }

  protected async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const result = await this.store.save(this.buildPayload());
    if (result && this.isNew()) {
      this.router.navigate(['/admin/viaturas', result.id], { replaceUrl: true });
    }
  }

  protected async onPublish(): Promise<void> {
    const current = this.store.current();
    if (!current?.images?.some((i) => i.isCover)) {
      this.toast.error('Para publicar é necessário pelo menos uma foto de capa.');
      this.activeTab.set('fotos');
      return;
    }
    await this.onSave();
    if (this.store.current()?.id) {
      await this.store.changeStatus(this.store.current()!.id, 'PUBLISHED');
    }
  }

  protected async onUpload(files: File[]): Promise<void> {
    const id = this.store.current()?.id;
    if (!id) return;
    await this.store.uploadImages(id, files);
  }

  protected onPhotoDrop(event: CdkDragDrop<unknown[]>): void {
    const images = [...(this.store.current()?.images ?? [])];
    moveItemInArray(images, event.previousIndex, event.currentIndex);
    const id = this.store.current()?.id;
    if (id) this.store.reorderImages(id, images.map((i) => i.id));
  }

  protected onSetCover(imageId: string): void {
    const id = this.store.current()?.id;
    if (id) this.store.setCover(id, imageId);
  }

  protected onUpdateAlt(imageId: string, alt: string): void {
    const id = this.store.current()?.id;
    if (id) this.store.updateImageAlt(id, imageId, alt);
  }

  protected async onDeleteImage(imageId: string): Promise<void> {
    const ok = await this.confirm.open({ title: 'Eliminar foto', message: 'Esta ação não pode ser revertida.', confirmLabel: 'Eliminar' });
    if (!ok) return;
    const id = this.store.current()?.id;
    if (id) this.store.deleteImage(id, imageId);
  }
}
