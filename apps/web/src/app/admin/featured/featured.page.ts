import {
  Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { formatEur } from '../../shared/util/format';

const ZONE_LABELS: Record<string, string> = {
  HOME_FEATURED: 'Em destaque — Homepage',
  BUDGET_SUGGESTIONS: 'Sugestões modo orçamento',
  ASSISTANT_BOOST: 'Reforço do assistente',
};

interface FeaturedVehicle {
  id: string;
  position: number;
  label: string | null;
  vehicle: {
    id: string;
    slug: string;
    status: string;
    brand: { name: string };
    model: { name: string };
    version: string;
    year: number;
    priceCents: number;
    coverImage: { variants: { thumb: string } } | null;
  };
}

interface VehicleSearch {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  priceCents: number;
  status: string;
}

@Component({
  selector: 'pm-featured-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CdkDrag, CdkDropList],
  template: `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-h2 font-display font-bold">{{ zoneLabel() }}</h1>
        <p class="text-caption text-ink-500 mt-0.5">Zona: {{ zone() }}</p>
      </div>
      <div class="flex gap-2">
        @for (z of zones; track z.value) {
          <a [routerLink]="['/admin/destaques', z.value]"
             class="px-3 py-1.5 rounded-lg text-caption transition-colors no-underline"
             [class]="zone() === z.value
               ? 'bg-red-500 text-white'
               : 'bg-ink-800 text-ink-300 hover:bg-ink-700'">
            {{ z.label }}
          </a>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="space-y-2">
        @for (i of [1,2,3]; track i) {
          <div class="h-16 rounded-lg bg-ink-900 animate-pulse"></div>
        }
      </div>
    } @else {
      <div
        cdkDropList
        (cdkDropListDropped)="onDrop($event)"
        class="space-y-2 mb-6"
      >
        @for (item of items(); track item.id; let i = $index) {
          <div cdkDrag
               class="flex items-center gap-3 rounded-xl bg-ink-900 p-3 cursor-grab
                      active:cursor-grabbing border border-ink-800 hover:border-ink-700">
            <!-- drag handle -->
            <span class="text-ink-600 select-none">⠿</span>

            <!-- thumb -->
            @if (item.vehicle.coverImage) {
              <img
                [src]="item.vehicle.coverImage.variants.thumb"
                [alt]="item.vehicle.brand.name"
                class="w-14 h-10 object-cover rounded-md shrink-0"
              />
            } @else {
              <div class="w-14 h-10 rounded-md bg-ink-800 shrink-0"></div>
            }

            <!-- info -->
            <div class="flex-1 min-w-0">
              <p class="text-label font-medium text-white truncate">
                {{ item.vehicle.brand.name }} {{ item.vehicle.model.name }} {{ item.vehicle.version }}
              </p>
              <p class="text-caption text-ink-500">
                {{ item.vehicle.year }} · {{ formatEur(item.vehicle.priceCents) }}
                @if (item.vehicle.status !== 'PUBLISHED') {
                  · <span class="text-amber-400">{{ item.vehicle.status }}</span>
                }
              </p>
            </div>

            <!-- remove -->
            <button (click)="remove(i)"
                    class="text-ink-600 hover:text-red-400 transition-colors p-1">
              <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        } @empty {
          <div class="rounded-xl bg-ink-900 p-8 text-center text-ink-500">
            Nenhuma viatura em destaque. Adicione abaixo.
          </div>
        }
      </div>

      <!-- Adicionar viatura -->
      <div class="rounded-xl bg-ink-900 p-4">
        <h3 class="text-label font-semibold mb-3">Adicionar viatura</h3>
        <input
          type="search"
          placeholder="Pesquisar por marca, modelo…"
          [value]="searchQ()"
          (input)="onSearch($event)"
          class="w-full h-10 px-3 rounded-lg bg-ink-800 border border-ink-700
                 text-label text-white placeholder-ink-600
                 focus:outline-none focus:border-red-500 transition-colors mb-3"
        />
        @if (searchResults().length > 0) {
          <div class="space-y-1 max-h-60 overflow-y-auto">
            @for (v of searchResults(); track v.id) {
              <button
                (click)="addVehicle(v.id)"
                class="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-ink-800
                       hover:bg-ink-700 transition-colors text-left"
              >
                <div>
                  <p class="text-label text-white">{{ v.brand }} {{ v.model }} {{ v.version }}</p>
                  <p class="text-caption text-ink-500">{{ v.year }} · {{ formatEur(v.priceCents) }}</p>
                </div>
              </button>
            }
          </div>
        }
      </div>

      <!-- Guardar -->
      <div class="mt-6 flex gap-3">
        <button
          (click)="save()"
          [disabled]="saving()"
          class="px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-label
                 hover:bg-red-600 disabled:opacity-50 transition-all"
        >
          {{ saving() ? 'A guardar…' : 'Guardar' }}
        </button>
        @if (saved()) {
          <span class="flex items-center text-green-400 text-label">Guardado!</span>
        }
      </div>
    }
  `,
})
export class FeaturedPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly sub = new Subscription();

  protected readonly formatEur = formatEur;

  protected readonly zones = [
    { value: 'HOME_FEATURED', label: 'Homepage' },
    { value: 'BUDGET_SUGGESTIONS', label: 'Orçamento' },
    { value: 'ASSISTANT_BOOST', label: 'Assistente' },
  ];

  protected readonly zone = signal('HOME_FEATURED');
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly items = signal<FeaturedVehicle[]>([]);
  protected readonly searchQ = signal('');
  protected readonly searchResults = signal<VehicleSearch[]>([]);

  protected readonly zoneLabel = computed(() => ZONE_LABELS[this.zone()] ?? this.zone());

  ngOnInit() {
    this.sub.add(
      this.route.paramMap.subscribe((p) => {
        const z = p.get('zona') ?? 'HOME_FEATURED';
        this.zone.set(z);
        this.loadFeatured(z);
      }),
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  private loadFeatured(zone: string) {
    this.loading.set(true);
    this.http.get<FeaturedVehicle[]>(`/api/v1/admin/featured?placement=${zone}`).subscribe({
      next: (items) => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected onDrop(event: CdkDragDrop<FeaturedVehicle[]>) {
    const list = [...this.items()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.items.set(list);
  }

  protected remove(index: number) {
    this.items.update((list) => list.filter((_, i) => i !== index));
  }

  protected onSearch(e: Event) {
    const q = (e.target as HTMLInputElement).value;
    this.searchQ.set(q);
    if (!q.trim()) { this.searchResults.set([]); return; }
    this.http.get<{ data: VehicleSearch[] }>(`/api/v1/admin/vehicles?q=${encodeURIComponent(q)}&pageSize=8`).subscribe({
      next: (r) => this.searchResults.set(
        r.data.filter((v) => !this.items().some((i) => i.vehicle.id === v.id)),
      ),
      error: () => {},
    });
  }

  protected addVehicle(vehicleId: string) {
    const v = this.searchResults().find((r) => r.id === vehicleId);
    if (!v) return;
    const newItem: FeaturedVehicle = {
      id: `new-${vehicleId}`,
      position: this.items().length,
      label: null,
      vehicle: {
        id: v.id,
        slug: v.slug,
        status: v.status,
        brand: { name: v.brand },
        model: { name: v.model },
        version: v.version,
        year: v.year,
        priceCents: v.priceCents,
        coverImage: null,
      },
    };
    this.items.update((list) => [...list, newItem]);
    this.searchResults.set([]);
    this.searchQ.set('');
  }

  protected save() {
    this.saving.set(true);
    const vehicleIds = this.items().map((i) => i.vehicle.id);
    this.http.put(`/api/v1/admin/featured/${this.zone()}`, { vehicleIds }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2000);
      },
      error: () => this.saving.set(false),
    });
  }
}
