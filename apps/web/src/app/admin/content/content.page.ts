import {
  Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

type Section = 'home' | 'advantages' | 'testimonials' | 'nav-items' | 'quick-filters' | 'search-examples' | 'legal-pages';

interface ContentItem {
  id: string;
  active: boolean;
  icon?: string;
  title?: string;
  text?: string;
  authorName?: string;
  vehicleLabel?: string;
  label?: string;
  route?: string | null;
  url?: string | null;
}

interface LegalPageData {
  title: string | null;
  body: string | null;
}

const SECTION_LABELS: Record<string, string> = {
  home: 'Homepage',
  advantages: 'Vantagens',
  testimonials: 'Testemunhos',
  'nav-items': 'Navegação',
  'quick-filters': 'Filtros rápidos',
  'search-examples': 'Frases de exemplo',
  'legal-pages': 'Páginas legais',
};

@Component({
  selector: 'pm-content-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex items-start gap-6">
      <!-- Sidebar de secções -->
      <nav class="shrink-0 w-44 flex flex-col gap-1">
        @for (s of sections; track s.value) {
          <a [routerLink]="['/admin/conteudo', s.value]"
             class="px-3 py-2 rounded-lg text-label transition-colors no-underline"
             [class]="section() === s.value
               ? 'bg-red-500/15 text-red-400'
               : 'text-ink-400 hover:text-white hover:bg-ink-800'">
            {{ s.label }}
          </a>
        }
      </nav>

      <!-- Conteúdo da secção -->
      <div class="flex-1 min-w-0">
        <h1 class="text-h2 font-display font-bold mb-6">{{ sectionLabel() }}</h1>

        @if (loading()) {
          <div class="space-y-3">
            @for (i of [1,2,3]; track i) {
              <div class="h-12 rounded-lg bg-ink-900 animate-pulse"></div>
            }
          </div>
        }

        <!-- ── HOME ─────────────────────────────────────────────────── -->
        @if (section() === 'home' && homeData()) {
          <form (submit)="saveHome($event)" class="flex flex-col gap-4">
            @for (field of homeFields; track field.key) {
              <div class="flex flex-col gap-1">
                <label class="text-caption text-ink-400">{{ field.label }}</label>
                <input
                  [name]="field.key"
                  [value]="homeData()[field.key] ?? ''"
                  type="text"
                  class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                         focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            }
            <div class="flex gap-3 mt-2">
              <button type="submit"
                      class="px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-label hover:bg-red-600 transition-all">
                Guardar
              </button>
              @if (saved()) { <span class="flex items-center text-green-400 text-label">Guardado!</span> }
            </div>
          </form>
        }

        <!-- ── ADVANTAGES ──────────────────────────────────────────── -->
        @if (section() === 'advantages') {
          <div class="space-y-2 mb-4">
            @for (item of listItems(); track item.id) {
              <div class="flex items-center gap-3 rounded-xl bg-ink-900 p-3">
                <span class="text-ink-400 w-8 text-center">{{ item.icon }}</span>
                <div class="flex-1">
                  <p class="text-label font-medium text-white">{{ item.title }}</p>
                  <p class="text-caption text-ink-500 truncate">{{ item.text }}</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [checked]="item.active"
                         (change)="toggleItem(item.id, !item.active)"
                         class="sr-only peer"/>
                  <div class="w-9 h-5 bg-ink-700 rounded-full peer-checked:bg-red-500 transition-colors"></div>
                </label>
                <button (click)="deleteItem('advantages', item.id)"
                        class="text-ink-600 hover:text-red-400 transition-colors p-1">
                  <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
                    <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            }
          </div>
          <form (submit)="addAdvantage($event)" class="rounded-xl bg-ink-900 p-4 flex flex-col gap-3">
            <h3 class="text-label font-semibold">Adicionar vantagem</h3>
            <div class="grid grid-cols-2 gap-3">
              <input name="icon" placeholder="Ícone (emoji ou texto)" required
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors"/>
              <input name="title" placeholder="Título" required
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors"/>
            </div>
            <textarea name="text" placeholder="Descrição" rows="2" required
                      class="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-label text-white resize-none focus:outline-none focus:border-red-500 transition-colors"></textarea>
            <button type="submit"
                    class="self-start px-4 py-2 rounded-lg bg-red-500 text-white text-caption font-medium hover:bg-red-600 transition-colors">
              Adicionar
            </button>
          </form>
        }

        <!-- ── TESTIMONIALS ────────────────────────────────────────── -->
        @if (section() === 'testimonials') {
          <div class="space-y-2 mb-4">
            @for (item of listItems(); track item.id) {
              <div class="flex items-start gap-3 rounded-xl bg-ink-900 p-3">
                <div class="flex-1">
                  <p class="text-label font-medium text-white">{{ item.authorName }}</p>
                  <p class="text-caption text-ink-500">{{ item.vehicleLabel }}</p>
                  <p class="text-caption text-ink-400 mt-1 line-clamp-2">{{ item.text }}</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer mt-1">
                  <input type="checkbox" [checked]="item.active"
                         (change)="toggleItem(item.id, !item.active)"
                         class="sr-only peer"/>
                  <div class="w-9 h-5 bg-ink-700 rounded-full peer-checked:bg-red-500 transition-colors"></div>
                </label>
                <button (click)="deleteItem('testimonials', item.id)"
                        class="text-ink-600 hover:text-red-400 transition-colors p-1 mt-1">
                  <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
                    <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            }
          </div>
          <form (submit)="addTestimonial($event)" class="rounded-xl bg-ink-900 p-4 flex flex-col gap-3">
            <h3 class="text-label font-semibold">Adicionar testemunho</h3>
            <div class="grid grid-cols-2 gap-3">
              <input name="authorName" placeholder="Nome" required
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors"/>
              <input name="vehicleLabel" placeholder="Viatura comprada" required
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors"/>
            </div>
            <textarea name="text" placeholder="Texto do testemunho" rows="2" required
                      class="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-label text-white resize-none focus:outline-none focus:border-red-500 transition-colors"></textarea>
            <button type="submit"
                    class="self-start px-4 py-2 rounded-lg bg-red-500 text-white text-caption font-medium hover:bg-red-600 transition-colors">
              Adicionar
            </button>
          </form>
        }

        <!-- ── NAV-ITEMS ──────────────────────────────────────────── -->
        @if (section() === 'nav-items') {
          <div class="space-y-2 mb-4">
            @for (item of listItems(); track item.id) {
              <div class="flex items-center gap-3 rounded-xl bg-ink-900 p-3">
                <div class="flex-1">
                  <p class="text-label font-medium text-white">{{ item.label }}</p>
                  <p class="text-caption text-ink-500">{{ item.route ?? item.url }}</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [checked]="item.active"
                         (change)="toggleItem(item.id, !item.active)"
                         class="sr-only peer"/>
                  <div class="w-9 h-5 bg-ink-700 rounded-full peer-checked:bg-red-500 transition-colors"></div>
                </label>
              </div>
            }
          </div>
          <form (submit)="addNavItem($event)" class="rounded-xl bg-ink-900 p-4 flex flex-col gap-3">
            <h3 class="text-label font-semibold">Adicionar item de navegação</h3>
            <div class="grid grid-cols-2 gap-3">
              <input name="label" placeholder="Etiqueta" required
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors"/>
              <input name="url" placeholder="URL (ou rota interna)"
                     class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors"/>
            </div>
            <button type="submit"
                    class="self-start px-4 py-2 rounded-lg bg-red-500 text-white text-caption font-medium hover:bg-red-600 transition-colors">
              Adicionar
            </button>
          </form>
        }

        <!-- ── QUICK-FILTERS ─────────────────────────────────────── -->
        @if (section() === 'quick-filters') {
          <div class="space-y-2 mb-4">
            @for (item of listItems(); track item.id) {
              <div class="flex items-center gap-3 rounded-xl bg-ink-900 p-3">
                <div class="flex-1">
                  <p class="text-label font-medium text-white">{{ item.label }}</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [checked]="item.active"
                         (change)="toggleItem(item.id, !item.active)"
                         class="sr-only peer"/>
                  <div class="w-9 h-5 bg-ink-700 rounded-full peer-checked:bg-red-500 transition-colors"></div>
                </label>
                <button (click)="deleteItem('quick-filters', item.id)"
                        class="text-ink-600 hover:text-red-400 transition-colors p-1">
                  <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
                    <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            }
          </div>
          <form (submit)="addQuickFilter($event)" class="rounded-xl bg-ink-900 p-4 flex flex-col gap-3">
            <h3 class="text-label font-semibold">Adicionar filtro rápido</h3>
            <input name="label" placeholder="Etiqueta do filtro" required
                   class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors"/>
            <p class="text-caption text-ink-600">Nota: os filtros são aplicados com base nos parâmetros de pesquisa (em breve com editor visual).</p>
            <button type="submit"
                    class="self-start px-4 py-2 rounded-lg bg-red-500 text-white text-caption font-medium hover:bg-red-600 transition-colors">
              Adicionar
            </button>
          </form>
        }

        <!-- ── SEARCH-EXAMPLES ───────────────────────────────────── -->
        @if (section() === 'search-examples') {
          <div class="space-y-2 mb-4">
            @for (item of listItems(); track item.id) {
              <div class="flex items-center gap-3 rounded-xl bg-ink-900 p-3">
                <p class="flex-1 text-label text-white">{{ item.text }}</p>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" [checked]="item.active"
                         (change)="toggleItem(item.id, !item.active)"
                         class="sr-only peer"/>
                  <div class="w-9 h-5 bg-ink-700 rounded-full peer-checked:bg-red-500 transition-colors"></div>
                </label>
                <button (click)="deleteSearchExample(item.id)"
                        class="text-ink-600 hover:text-red-400 transition-colors p-1">
                  <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
                    <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            }
          </div>
          <form (submit)="addSearchExample($event)" class="rounded-xl bg-ink-900 p-4 flex gap-3">
            <input name="text" placeholder="Ex: SUV automático até 300€/mês" required
                   class="flex-1 h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors"/>
            <button type="submit"
                    class="px-4 py-2 rounded-lg bg-red-500 text-white text-caption font-medium hover:bg-red-600 transition-colors">
              Adicionar
            </button>
          </form>
        }

        <!-- ── LEGAL-PAGES ────────────────────────────────────────── -->
        @if (section() === 'legal-pages') {
          <div class="flex gap-2 mb-4">
            @for (p of legalPageSlugs; track p.value) {
              <button
                (click)="setLegalSlug(p.value)"
                class="px-3 py-1.5 rounded-lg text-caption transition-colors"
                [class]="legalSlug() === p.value
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-ink-800 text-ink-400 hover:bg-ink-700'"
              >{{ p.label }}</button>
            }
          </div>
          @if (legalPage()) {
            <form (submit)="saveLegalPage($event)" class="flex flex-col gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-caption text-ink-400">Título</label>
                <input name="title" [value]="legalPage().title ?? ''"
                       class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white focus:outline-none focus:border-red-500 transition-colors"/>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-caption text-ink-400">Conteúdo (Markdown)</label>
                <textarea name="body" rows="14" [value]="legalPage().body ?? ''"
                          class="w-full px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-label text-white font-mono text-[13px] resize-y focus:outline-none focus:border-red-500 transition-colors"></textarea>
              </div>
              <div class="flex gap-3">
                <button type="submit"
                        class="px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-label hover:bg-red-600 transition-all">
                  Guardar
                </button>
                @if (saved()) { <span class="flex items-center text-green-400 text-label">Guardado!</span> }
              </div>
            </form>
          }
        }
      </div>
    </div>
  `,
})
export class ContentPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly sub = new Subscription();

  protected readonly sections = Object.entries(SECTION_LABELS).map(([value, label]) => ({ value, label }));

  protected readonly section = signal<Section>('home');
  protected readonly loading = signal(false);
  protected readonly saved = signal(false);
  protected readonly homeData = signal<Record<string, string>>({});
  protected readonly listItems = signal<ContentItem[]>([]);
  protected readonly legalSlug = signal('privacidade');
  protected readonly legalPage = signal<LegalPageData>({ title: null, body: null });

  protected readonly legalPageSlugs = [
    { value: 'privacidade', label: 'Privacidade' },
    { value: 'cookies', label: 'Cookies' },
    { value: 'termos', label: 'Termos' },
  ];

  protected readonly sectionLabel = computed(() => SECTION_LABELS[this.section()] ?? this.section());

  protected readonly homeFields = [
    { key: 'heroTitle', label: 'Título do hero' },
    { key: 'heroSubtitle', label: 'Subtítulo do hero' },
    { key: 'stockLine', label: 'Linha de stock' },
    { key: 'advantagesTitle', label: 'Título das vantagens' },
    { key: 'testimonialsTitle', label: 'Título dos testemunhos' },
    { key: 'assistantTitle', label: 'Título do assistente' },
    { key: 'assistantSubtitle', label: 'Subtítulo do assistente' },
  ];

  ngOnInit() {
    this.sub.add(
      this.route.paramMap.subscribe((p) => {
        const s = (p.get('secao') ?? 'home') as Section;
        this.section.set(s);
        this.loadSection(s);
      }),
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  private loadSection(s: Section) {
    this.loading.set(true);
    if (s === 'home') {
      this.http.get<Record<string, string>>('/api/v1/admin/content/home').subscribe({
        next: (d) => { this.homeData.set(d ?? {}); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else if (s === 'legal-pages') {
      this.loading.set(false);
      this.loadLegalPage(this.legalSlug());
    } else {
      const endpointMap: Record<string, string> = {
        advantages: 'advantages',
        testimonials: 'testimonials',
        'nav-items': 'nav-items',
        'quick-filters': 'quick-filters',
        'search-examples': 'search-examples',
      };
      const endpoint = endpointMap[s];
      if (endpoint) {
        this.http.get<ContentItem[]>(`/api/v1/admin/content/${endpoint}`).subscribe({
          next: (items) => { this.listItems.set(items); this.loading.set(false); },
          error: () => this.loading.set(false),
        });
      } else {
        this.loading.set(false);
      }
    }
  }

  private loadLegalPage(slug: string) {
    this.http.get<LegalPageData>(`/api/v1/public/pages/${slug}`).subscribe({
      next: (p) => this.legalPage.set(p ?? { title: null, body: null }),
      error: () => this.legalPage.set({ title: null, body: null }),
    });
  }

  protected setLegalSlug(slug: string) {
    this.legalSlug.set(slug);
    this.loadLegalPage(slug);
  }

  protected saveHome(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data: Record<string, string> = {};
    this.homeFields.forEach(({ key }) => {
      data[key] = (form.elements.namedItem(key) as HTMLInputElement).value;
    });
    this.http.put('/api/v1/admin/content/home', data).subscribe({
      next: () => { this.flashSaved(); },
    });
  }

  protected addAdvantage(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      icon: (form.elements.namedItem('icon') as HTMLInputElement).value,
      title: (form.elements.namedItem('title') as HTMLInputElement).value,
      text: (form.elements.namedItem('text') as HTMLTextAreaElement).value,
    };
    this.http.post<ContentItem>('/api/v1/admin/content/advantages', data).subscribe({
      next: (item) => { this.listItems.update((l) => [...l, item as ContentItem]); form.reset(); },
    });
  }

  protected addTestimonial(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      authorName: (form.elements.namedItem('authorName') as HTMLInputElement).value,
      vehicleLabel: (form.elements.namedItem('vehicleLabel') as HTMLInputElement).value,
      text: (form.elements.namedItem('text') as HTMLTextAreaElement).value,
    };
    this.http.post<ContentItem>('/api/v1/admin/content/testimonials', data).subscribe({
      next: (item) => { this.listItems.update((l) => [...l, item as ContentItem]); form.reset(); },
    });
  }

  protected addNavItem(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const url = (form.elements.namedItem('url') as HTMLInputElement).value;
    const data = {
      label: (form.elements.namedItem('label') as HTMLInputElement).value,
      url: url || undefined,
    };
    this.http.post<ContentItem>('/api/v1/admin/content/nav-items', data).subscribe({
      next: (item) => { this.listItems.update((l) => [...l, item as ContentItem]); form.reset(); },
    });
  }

  protected addQuickFilter(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      label: (form.elements.namedItem('label') as HTMLInputElement).value,
      filters: {},
    };
    this.http.post<ContentItem>('/api/v1/admin/content/quick-filters', data).subscribe({
      next: (item) => { this.listItems.update((l) => [...l, item as ContentItem]); form.reset(); },
    });
  }

  protected addSearchExample(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = { text: (form.elements.namedItem('text') as HTMLInputElement).value };
    this.http.post<ContentItem>('/api/v1/admin/content/search-examples', data).subscribe({
      next: (item) => { this.listItems.update((l) => [...l, item as ContentItem]); form.reset(); },
    });
  }

  protected deleteSearchExample(id: string) {
    this.http.patch(`/api/v1/admin/content/search-examples/${id}`, { active: false }).subscribe({
      next: () => this.listItems.update((l) => l.filter((i) => (i['id'] as string) !== id)),
    });
  }

  protected toggleItem(id: string, active: boolean) {
    const s = this.section();
    const endpointMap: Record<string, string> = {
      advantages: 'advantages', testimonials: 'testimonials',
      'nav-items': 'nav-items', 'quick-filters': 'quick-filters', 'search-examples': 'search-examples',
    };
    const ep = endpointMap[s];
    if (!ep) return;
    this.http.patch(`/api/v1/admin/content/${ep}/${id}`, { active }).subscribe({
      next: () => this.listItems.update((l) =>
        l.map((i) => (i['id'] as string) === id ? { ...i, active } : i),
      ),
    });
  }

  protected deleteItem(type: string, id: string) {
    const epMap: Record<string, string> = {
      advantages: 'advantages', testimonials: 'testimonials',
      'quick-filters': 'quick-filters',
    };
    const ep = epMap[type];
    if (!ep) return;
    this.http.delete(`/api/v1/admin/content/${ep}/${id}`).subscribe({
      next: () => this.listItems.update((l) => l.filter((i) => (i['id'] as string) !== id)),
    });
  }

  protected saveLegalPage(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      title: (form.elements.namedItem('title') as HTMLInputElement).value,
      body: (form.elements.namedItem('body') as HTMLTextAreaElement).value,
    };
    this.http.put<LegalPageData>(`/api/v1/admin/content/legal-pages/${this.legalSlug()}`, data).subscribe({
      next: (p) => { this.legalPage.set(p); this.flashSaved(); },
    });
  }

  private flashSaved() {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
