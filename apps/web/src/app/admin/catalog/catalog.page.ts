import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CatalogStore } from './catalog.store';
import { PmButton } from '../../shared/ui/pm-button/pm-button';
import { PmInput } from '../../shared/ui/pm-input/pm-input';
import { ConfirmDialogService } from '../../shared/ui/pm-confirm-dialog/pm-confirm-dialog';
import type { Brand, Model, EquipmentItem, SearchSynonym } from './catalog.api';

type CatalogType = 'marcas' | 'modelos' | 'equipamento' | 'sinonimos';

@Component({
  selector: 'pm-catalog-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CatalogStore],
  imports: [FormsModule, ReactiveFormsModule, PmButton, PmInput],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="font-display text-h1 font-semibold text-ink-100">{{ pageTitle() }}</h1>
        <pm-button size="sm" (click)="openForm()">+ Novo</pm-button>
      </div>

      <!-- Parse test (sinónimos) -->
      @if (tipo() === 'sinonimos') {
        <div class="mb-6 rounded-xl border border-ink-800 bg-ink-900 p-4">
          <h2 class="mb-2 text-sm font-medium text-ink-300">Testar parser</h2>
          <div class="flex gap-2">
            <input
              type="text"
              [(ngModel)]="parseQuery"
              placeholder="ex.: SUV diesel até 250€/mês"
              class="flex-1 rounded-xl border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:border-red-400 focus:outline-none"
            />
            <pm-button size="sm" variant="secondary" (click)="runParseTest()">Testar</pm-button>
          </div>
          @if (parseResult().length > 0) {
            <div class="mt-2 flex flex-wrap gap-2">
              @for (chip of parseResult(); track $index) {
                <span class="rounded-full border border-ink-700 bg-ink-850 px-3 py-1 text-xs text-ink-200">{{ chipLabel(chip) }}</span>
              }
            </div>
          }
        </div>
      }

      <!-- Lista -->
      <div class="rounded-xl border border-ink-800 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="border-b border-ink-800 bg-ink-900">
            <tr>
              @for (col of tableColumns(); track col) {
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-400">{{ col }}</th>
              }
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-ink-400">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-800">
            @if (store.loading()) {
              @for (i of [1,2,3]; track i) {
                <tr class="animate-pulse">
                  @for (c of tableColumns(); track c) {
                    <td class="px-4 py-3"><div class="h-4 rounded bg-ink-800"></div></td>
                  }
                  <td class="px-4 py-3"></td>
                </tr>
              }
            } @else {
              @for (row of displayRows(); track row.id) {
                <tr class="hover:bg-ink-850 transition-colors">
                  @for (col of tableColumns(); track col) {
                    <td class="px-4 py-3 text-ink-200">{{ getCellValue(row, col) }}</td>
                  }
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button (click)="openForm(row)" class="rounded px-2 py-1 text-xs text-ink-400 hover:bg-ink-800 transition-colors">Editar</button>
                      <button (click)="onDelete(row)" class="rounded px-2 py-1 text-xs text-error hover:bg-error-bg transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Modal de formulário inline -->
      @if (formOpen()) {
        <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/70" (click)="closeForm()">
          <div class="w-full max-w-md rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-overlay" (click)="$event.stopPropagation()">
            <h2 class="mb-4 text-lg font-semibold text-ink-100">{{ editing() ? 'Editar' : 'Novo' }}</h2>

            @if (tipo() === 'marcas' || tipo() === 'modelos') {
              <div class="flex flex-col gap-3">
                <pm-input label="Nome *" [formControl]="$any(brandModelForm.get('name'))" />
                @if (tipo() === 'modelos') {
                  <div>
                    <label class="mb-1 block text-sm font-medium text-ink-300">Marca *</label>
                    <select [formControl]="$any(brandModelForm.get('brandId'))" class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none">
                      <option value="">Selecionar marca</option>
                      @for (b of store.brands(); track b.id) {
                        <option [value]="b.id">{{ b.name }}</option>
                      }
                    </select>
                  </div>
                }
                <pm-input label="Aliases (separados por vírgula)" [formControl]="$any(brandModelForm.get('aliases'))" placeholder="ex.: vw, volkswagen" />
              </div>
            }

            @if (tipo() === 'equipamento') {
              <div class="flex flex-col gap-3">
                <pm-input label="Nome *" [formControl]="$any(equipmentForm.get('name'))" />
                <div>
                  <label class="mb-1 block text-sm font-medium text-ink-300">Categoria *</label>
                  <select [formControl]="$any(equipmentForm.get('category'))" class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none">
                    @for (c of equipmentCategories; track c.value) {
                      <option [value]="c.value">{{ c.label }}</option>
                    }
                  </select>
                </div>
              </div>
            }

            @if (tipo() === 'sinonimos') {
              <div class="flex flex-col gap-3">
                <pm-input label="Termo *" [formControl]="$any(synonymForm.get('term'))" placeholder="ex.: gasóleo" />
                <pm-input label="Mapeia para *" [formControl]="$any(synonymForm.get('maps'))" placeholder="ex.: DIESEL" />
                <div>
                  <label class="mb-1 block text-sm font-medium text-ink-300">Categoria *</label>
                  <select [formControl]="$any(synonymForm.get('category'))" class="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-red-400 focus:outline-none">
                    <option value="fuel">Combustível</option>
                    <option value="body">Carroçaria</option>
                    <option value="transmission">Caixa</option>
                    <option value="feature">Característica</option>
                  </select>
                </div>
              </div>
            }

            <div class="mt-6 flex justify-end gap-3">
              <pm-button variant="secondary" (click)="closeForm()">Cancelar</pm-button>
              <pm-button [loading]="store.saving()" (click)="onSave()">Guardar</pm-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CatalogPage implements OnInit {
  protected readonly store = inject(CatalogStore);
  private readonly route = inject(ActivatedRoute);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);

  protected readonly tipo = signal<CatalogType>('marcas');
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<string | null>(null);
  protected readonly parseQuery = signal('');
  protected readonly parseResult = signal<unknown[]>([]);

  protected readonly brandModelForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    brandId: [''],
    aliases: [''],
  });

  protected readonly equipmentForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['SAFETY', Validators.required],
  });

  protected readonly synonymForm = this.fb.nonNullable.group({
    term: ['', Validators.required],
    maps: ['', Validators.required],
    category: ['fuel', Validators.required],
  });

  protected readonly equipmentCategories = [
    { value: 'SAFETY', label: 'Segurança' },
    { value: 'COMFORT', label: 'Conforto' },
    { value: 'MULTIMEDIA', label: 'Multimédia' },
    { value: 'EXTERIOR', label: 'Exterior' },
    { value: 'INTERIOR', label: 'Interior' },
    { value: 'DRIVING', label: 'Condução' },
  ];

  protected pageTitle() {
    const t: Record<string, string> = {
      marcas: 'Marcas', modelos: 'Modelos', equipamento: 'Equipamento', sinonimos: 'Sinónimos',
    };
    return t[this.tipo()] ?? 'Catálogos';
  }

  protected tableColumns(): string[] {
    const t = this.tipo();
    if (t === 'marcas') return ['Nome', 'Aliases'];
    if (t === 'modelos') return ['Nome', 'Marca', 'Aliases'];
    if (t === 'equipamento') return ['Nome', 'Categoria'];
    return ['Termo', 'Mapeia para', 'Categoria'];
  }

  protected displayRows(): Array<{ id: string; [key: string]: unknown }> {
    const t = this.tipo();
    if (t === 'marcas') return this.store.brands() as unknown as Array<{ id: string; [key: string]: unknown }>;
    if (t === 'modelos') return this.store.models() as unknown as Array<{ id: string; [key: string]: unknown }>;
    if (t === 'equipamento') return this.store.equipmentItems() as unknown as Array<{ id: string; [key: string]: unknown }>;
    return this.store.synonyms() as unknown as Array<{ id: string; [key: string]: unknown }>;
  }

  protected getCellValue(row: { id: string; [key: string]: unknown }, col: string): string {
    const map: Record<string, string> = {
      'Nome': 'name', 'Aliases': 'aliases', 'Marca': 'brandId', 'Categoria': 'category',
      'Termo': 'term', 'Mapeia para': 'maps',
    };
    const key = map[col] ?? col.toLowerCase();
    if (key === 'aliases') return Array.isArray(row['aliases']) ? (row['aliases'] as string[]).join(', ') : '';
    if (key === 'brandId') {
      const brand = this.store.brands().find((b) => b.id === row['brandId']);
      return brand?.name ?? '';
    }
    return String(row[key] ?? '');
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tipo = (params.get('tipo') ?? 'marcas') as CatalogType;
      this.tipo.set(tipo);
      this.store.loadAll();
      if (tipo === 'sinonimos') this.store.loadSynonyms();
    });
  }

  protected openForm(row?: { id: string; [key: string]: unknown }): void {
    this.editing.set(row?.id ?? null);
    if (row) {
      const t = this.tipo();
      if (t === 'marcas' || t === 'modelos') {
        this.brandModelForm.patchValue({
          name: String(row['name'] ?? ''),
          brandId: String(row['brandId'] ?? ''),
          aliases: Array.isArray(row['aliases']) ? (row['aliases'] as string[]).join(', ') : '',
        });
      } else if (t === 'equipamento') {
        this.equipmentForm.patchValue({ name: String(row['name'] ?? ''), category: String(row['category'] ?? 'SAFETY') });
      } else {
        this.synonymForm.patchValue({ term: String(row['term'] ?? ''), maps: String(row['maps'] ?? ''), category: String(row['category'] ?? 'fuel') });
      }
    } else {
      this.brandModelForm.reset({ name: '', brandId: '', aliases: '' });
      this.equipmentForm.reset({ name: '', category: 'SAFETY' });
      this.synonymForm.reset({ term: '', maps: '', category: 'fuel' });
    }
    this.formOpen.set(true);
  }

  protected closeForm(): void { this.formOpen.set(false); }

  protected async onSave(): Promise<void> {
    const t = this.tipo();
    const id = this.editing() ?? undefined;
    let ok = false;

    if (t === 'marcas') {
      const v = this.brandModelForm.getRawValue();
      ok = await this.store.saveBrand({ name: v.name, aliases: v.aliases ? v.aliases.split(',').map((s) => s.trim()) : [] }, id);
    } else if (t === 'modelos') {
      const v = this.brandModelForm.getRawValue();
      ok = await this.store.saveModel({ name: v.name, brandId: v.brandId, aliases: v.aliases ? v.aliases.split(',').map((s) => s.trim()) : [] }, id);
    } else if (t === 'equipamento') {
      ok = await this.store.saveEquipment(this.equipmentForm.getRawValue(), id);
    } else {
      ok = await this.store.saveSynonym(this.synonymForm.getRawValue(), id);
    }

    if (ok) this.closeForm();
  }

  protected async onDelete(row: { id: string; name?: string; term?: string }): Promise<void> {
    const name = String(row['name'] ?? row['term'] ?? '');
    const ok = await this.confirm.open({ title: 'Eliminar', message: `Eliminar "${name}"?`, confirmLabel: 'Eliminar' });
    if (!ok) return;
    const t = this.tipo();
    if (t === 'marcas') await this.store.deleteBrand(row.id);
    else if (t === 'modelos') await this.store.deleteModel(row.id);
    else if (t === 'equipamento') await this.store.deleteEquipment(row.id);
    else await this.store.deleteSynonym(row.id);
  }

  protected async runParseTest(): Promise<void> {
    const chips = await this.store.parseTest(this.parseQuery());
    this.parseResult.set(chips);
  }

  protected chipLabel(chip: unknown): string {
    if (typeof chip === 'object' && chip !== null) {
      const c = chip as Record<string, unknown>;
      return `${c['type'] ?? c['key']}: ${c['value'] ?? c['label'] ?? JSON.stringify(chip)}`;
    }
    return String(chip);
  }
}
