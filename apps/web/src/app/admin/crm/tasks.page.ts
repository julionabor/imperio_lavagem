import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CrmApi, type Task } from './crm.api';

@Component({
  selector: 'pm-tasks-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-h2 font-display font-bold">Tarefas</h1>
      <div class="flex gap-2">
        <button
          (click)="setFilter('mine')"
          [class]="filter() === 'mine'
            ? 'px-3 py-1.5 rounded-lg bg-red-500 text-white text-caption font-medium'
            : 'px-3 py-1.5 rounded-lg bg-ink-800 text-ink-300 text-caption hover:bg-ink-700 transition-colors'"
        >As minhas</button>
        <button
          (click)="setFilter('all')"
          [class]="filter() === 'all'
            ? 'px-3 py-1.5 rounded-lg bg-red-500 text-white text-caption font-medium'
            : 'px-3 py-1.5 rounded-lg bg-ink-800 text-ink-300 text-caption hover:bg-ink-700 transition-colors'"
        >Todas abertas</button>
      </div>
    </div>

    @if (loading()) {
      <div class="space-y-2">
        @for (i of [1,2,3,4,5]; track i) {
          <div class="h-16 rounded-lg bg-ink-900 animate-pulse"></div>
        }
      </div>
    } @else {
      <div class="rounded-xl bg-ink-900 overflow-hidden">
        <table class="w-full text-label">
          <thead>
            <tr class="border-b border-ink-800">
              <th class="w-8 px-4 py-3"></th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium">Tarefa</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium hidden sm:table-cell">Contacto</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium hidden md:table-cell">Prazo</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium hidden lg:table-cell">Responsável</th>
            </tr>
          </thead>
          <tbody>
            @for (task of tasks(); track task.id) {
              <tr class="border-b border-ink-800/50"
                  [class.opacity-50]="task.status === 'DONE'">
                <td class="px-4 py-3">
                  <button
                    (click)="complete(task.id)"
                    [disabled]="task.status !== 'OPEN'"
                    class="w-4 h-4 rounded border transition-colors"
                    [class]="task.status === 'DONE'
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-ink-600 hover:border-green-500'"
                  >
                    @if (task.status === 'DONE') {
                      <svg viewBox="0 0 12 12" class="w-full h-full text-green-400" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    }
                  </button>
                </td>
                <td class="px-4 py-3">
                  <p class="text-ink-200">{{ task.title }}</p>
                  @if (isOverdue(task) && task.status === 'OPEN') {
                    <span class="text-[11px] text-red-400">Em atraso</span>
                  }
                </td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <a [routerLink]="['/admin/crm/contactos', task.contactId]"
                     class="text-ink-300 hover:text-white no-underline transition-colors">
                    {{ task.contact.name }}
                  </a>
                </td>
                <td class="px-4 py-3 text-ink-500 hidden md:table-cell">
                  {{ formatDate(task.dueAt) }}
                </td>
                <td class="px-4 py-3 text-ink-500 hidden lg:table-cell">
                  {{ task.assignee?.name ?? '—' }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-4 py-12 text-center text-ink-500">Sem tarefas.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class TasksPage implements OnInit {
  private readonly api = inject(CrmApi);

  protected readonly loading = signal(true);
  protected readonly tasks = signal<Task[]>([]);
  protected readonly filter = signal<'mine' | 'all'>('mine');

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    const obs = this.filter() === 'mine'
      ? this.api.listMyTasks()
      : this.api.listTasks({ status: 'OPEN' }).pipe();

    if (this.filter() === 'mine') {
      this.api.listMyTasks().subscribe({
        next: (t) => { this.tasks.set(t); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else {
      this.api.listTasks({ status: 'OPEN' }).subscribe({
        next: (r: { data: Task[] }) => { this.tasks.set(r.data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    }
  }

  protected setFilter(f: 'mine' | 'all') {
    this.filter.set(f);
    this.load();
  }

  protected complete(id: string) {
    this.api.updateTask(id, { status: 'DONE' }).subscribe({
      next: () => this.tasks.update((list) =>
        list.map((t) => t.id === id ? { ...t, status: 'DONE' as const } : t),
      ),
    });
  }

  protected isOverdue(task: Task) {
    return new Date(task.dueAt) < new Date();
  }

  protected formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
