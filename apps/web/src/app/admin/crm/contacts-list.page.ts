import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CrmApi, type ContactSummary } from './crm.api';

const LIFECYCLE_LABELS: Record<string, string> = {
  LEAD: 'Lead', PROSPECT: 'Prospect', CUSTOMER: 'Cliente', INACTIVE: 'Inativo',
};
const LIFECYCLE_COLORS: Record<string, string> = {
  LEAD: 'bg-blue-500/15 text-blue-400',
  PROSPECT: 'bg-yellow-500/15 text-yellow-400',
  CUSTOMER: 'bg-green-500/15 text-green-400',
  INACTIVE: 'bg-ink-700 text-ink-500',
};

@Component({
  selector: 'pm-contacts-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-h2 font-display font-bold">Contactos</h1>
      <a routerLink="/admin/crm"
         class="px-4 py-2 rounded-lg border border-ink-700 text-label text-ink-300
                hover:border-ink-500 hover:text-white transition-colors no-underline">
        Pipeline
      </a>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input
        type="search"
        placeholder="Pesquisar nome, telemóvel ou email…"
        [value]="q()"
        (input)="onSearch($event)"
        class="w-full max-w-md h-10 px-3 rounded-lg bg-ink-800 border border-ink-700
               text-label text-white placeholder-ink-600
               focus:outline-none focus:border-red-500 transition-colors"
      />
    </div>

    @if (loading()) {
      <div class="space-y-2">
        @for (i of [1,2,3,4,5]; track i) {
          <div class="h-14 rounded-lg bg-ink-900 animate-pulse"></div>
        }
      </div>
    } @else {
      <div class="rounded-xl bg-ink-900 overflow-hidden">
        <table class="w-full text-label">
          <thead>
            <tr class="border-b border-ink-800">
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium">Nome</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium hidden sm:table-cell">Telemóvel</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium hidden md:table-cell">Fase</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium hidden lg:table-cell">Leads</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium hidden lg:table-cell">Última interação</th>
            </tr>
          </thead>
          <tbody>
            @for (contact of contacts(); track contact.id) {
              <tr class="border-b border-ink-800/50 hover:bg-ink-800/50 cursor-pointer transition-colors"
                  [routerLink]="['/admin/crm/contactos', contact.id]">
                <td class="px-4 py-3">
                  <div class="font-medium text-white">{{ contact.name }}</div>
                  <div class="text-caption text-ink-500 sm:hidden">{{ contact.phone }}</div>
                </td>
                <td class="px-4 py-3 text-ink-300 hidden sm:table-cell">{{ contact.phone }}</td>
                <td class="px-4 py-3 hidden md:table-cell">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-medium {{ lifecycleColor(contact.lifecycle) }}">
                    {{ lifecycleLabel(contact.lifecycle) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-ink-400 hidden lg:table-cell">{{ contact._count.leads }}</td>
                <td class="px-4 py-3 text-ink-500 text-caption hidden lg:table-cell">
                  {{ contact.lastInteractionAt ? formatDate(contact.lastInteractionAt) : '—' }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-4 py-12 text-center text-ink-500">Nenhum contacto encontrado.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (total() > pageSize) {
        <div class="flex justify-center gap-2 mt-4">
          <button
            [disabled]="page() === 1"
            (click)="goPage(page() - 1)"
            class="px-3 py-1.5 rounded-lg bg-ink-800 text-label text-ink-300 disabled:opacity-40
                   hover:bg-ink-700 transition-colors"
          >Anterior</button>
          <span class="px-3 py-1.5 text-label text-ink-500">
            {{ page() }} / {{ totalPages() }}
          </span>
          <button
            [disabled]="page() >= totalPages()"
            (click)="goPage(page() + 1)"
            class="px-3 py-1.5 rounded-lg bg-ink-800 text-label text-ink-300 disabled:opacity-40
                   hover:bg-ink-700 transition-colors"
          >Seguinte</button>
        </div>
      }
    }
  `,
})
export class ContactsListPage implements OnInit {
  private readonly api = inject(CrmApi);

  protected readonly loading = signal(true);
  protected readonly contacts = signal<ContactSummary[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly q = signal('');
  protected readonly pageSize = 20;

  protected readonly totalPages = () => Math.ceil(this.total() / this.pageSize);

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.api.listContacts({ q: this.q() || undefined, page: this.page(), pageSize: this.pageSize }).subscribe({
      next: (r) => {
        this.contacts.set(r.data);
        this.total.set(r.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onSearch(e: Event) {
    this.q.set((e.target as HTMLInputElement).value);
    this.page.set(1);
    this.load();
  }

  protected goPage(p: number) {
    this.page.set(p);
    this.load();
  }

  protected lifecycleLabel(l: string) { return LIFECYCLE_LABELS[l] ?? l; }
  protected lifecycleColor(l: string) { return LIFECYCLE_COLORS[l] ?? 'bg-ink-700 text-ink-400'; }
  protected formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
