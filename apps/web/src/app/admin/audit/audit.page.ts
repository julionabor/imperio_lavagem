import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  user: { name: string; email: string } | null;
  diff: unknown;
  createdAt: string;
}

@Component({
  selector: 'pm-audit-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-h2 font-display font-bold mb-6">Auditoria</h1>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input
        type="search"
        placeholder="Entidade (ex: Vehicle)"
        [value]="filterEntity()"
        (input)="onFilter($event, 'entity')"
        class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
               placeholder-ink-600 focus:outline-none focus:border-red-500 transition-colors"
      />
      <select
        [value]="filterAction()"
        (change)="onFilter($event, 'action')"
        class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
               focus:outline-none focus:border-red-500 transition-colors"
      >
        <option value="">Todas as ações</option>
        <option value="CREATE">CREATE</option>
        <option value="UPDATE">UPDATE</option>
        <option value="DELETE">DELETE</option>
      </select>
    </div>

    @if (loading()) {
      <div class="space-y-2">
        @for (i of [1,2,3,4,5,6]; track i) {
          <div class="h-12 rounded-lg bg-ink-900 animate-pulse"></div>
        }
      </div>
    } @else {
      <div class="rounded-xl bg-ink-900 overflow-hidden">
        <table class="w-full text-label">
          <thead>
            <tr class="border-b border-ink-800">
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium">Data</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium">Utilizador</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium">Ação</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium">Entidade</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium hidden lg:table-cell">ID</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of entries(); track entry.id) {
              <tr class="border-b border-ink-800/50 hover:bg-ink-800/30 transition-colors">
                <td class="px-4 py-3 text-caption text-ink-500">{{ formatDate(entry.createdAt) }}</td>
                <td class="px-4 py-3 text-ink-300">
                  {{ entry.user?.name ?? '—' }}
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-[11px] font-medium"
                        [class]="actionColor(entry.action)">
                    {{ entry.action }}
                  </span>
                </td>
                <td class="px-4 py-3 text-ink-200">{{ entry.entity }}</td>
                <td class="px-4 py-3 text-caption text-ink-600 font-mono hidden lg:table-cell">
                  {{ (entry.entityId ?? '').slice(0, 8) }}…
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-4 py-12 text-center text-ink-500">Nenhum registo.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (total() > pageSize) {
        <div class="flex justify-center gap-2 mt-4">
          <button [disabled]="page() === 1" (click)="goPage(page() - 1)"
                  class="px-3 py-1.5 rounded-lg bg-ink-800 text-label text-ink-300 disabled:opacity-40 hover:bg-ink-700 transition-colors">
            Anterior
          </button>
          <span class="px-3 py-1.5 text-label text-ink-500">{{ page() }} / {{ totalPages() }}</span>
          <button [disabled]="page() >= totalPages()" (click)="goPage(page() + 1)"
                  class="px-3 py-1.5 rounded-lg bg-ink-800 text-label text-ink-300 disabled:opacity-40 hover:bg-ink-700 transition-colors">
            Seguinte
          </button>
        </div>
      }
    }
  `,
})
export class AuditPage implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly loading = signal(true);
  protected readonly entries = signal<AuditLogEntry[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly filterEntity = signal('');
  protected readonly filterAction = signal('');
  protected readonly pageSize = 25;

  protected readonly totalPages = () => Math.ceil(this.total() / this.pageSize);

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    let p = new HttpParams()
      .set('page', String(this.page()))
      .set('pageSize', String(this.pageSize));
    if (this.filterEntity()) p = p.set('entity', this.filterEntity());
    if (this.filterAction()) p = p.set('action', this.filterAction());

    this.http.get<{ data: AuditLogEntry[]; meta: { total: number } }>('/api/v1/admin/audit', { params: p }).subscribe({
      next: (r) => {
        this.entries.set(r.data);
        this.total.set(r.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onFilter(e: Event, field: 'entity' | 'action') {
    const value = (e.target as HTMLInputElement | HTMLSelectElement).value;
    if (field === 'entity') this.filterEntity.set(value);
    else this.filterAction.set(value);
    this.page.set(1);
    this.load();
  }

  protected goPage(p: number) {
    this.page.set(p);
    this.load();
  }

  protected actionColor(action: string) {
    if (action === 'CREATE') return 'bg-green-500/15 text-green-400';
    if (action === 'DELETE') return 'bg-red-500/15 text-red-400';
    return 'bg-blue-500/15 text-blue-400';
  }

  protected formatDate(iso: string) {
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}
