import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'SALES';
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = { ADMIN: 'Admin', EDITOR: 'Editor', SALES: 'Comercial' };
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-500/15 text-red-400',
  EDITOR: 'bg-blue-500/15 text-blue-400',
  SALES: 'bg-green-500/15 text-green-400',
};

@Component({
  selector: 'pm-users-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-h2 font-display font-bold">Utilizadores</h1>
      <button
        (click)="showForm.set(!showForm())"
        class="px-4 py-2 rounded-lg bg-red-500 text-white text-caption font-medium
               hover:bg-red-600 transition-colors"
      >
        + Convidar utilizador
      </button>
    </div>

    @if (showForm()) {
      <form (submit)="invite($event)"
            class="rounded-xl bg-ink-900 p-4 mb-6 flex flex-col gap-3 max-w-lg">
        <h3 class="text-label font-semibold">Novo utilizador</h3>
        <div class="grid grid-cols-2 gap-3">
          <input name="name" placeholder="Nome" required
                 class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                        focus:outline-none focus:border-red-500 transition-colors"/>
          <input name="email" type="email" placeholder="Email" required
                 class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                        focus:outline-none focus:border-red-500 transition-colors"/>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <select name="role"
                  class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                         focus:outline-none focus:border-red-500 transition-colors">
            <option value="SALES">Comercial</option>
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input name="password" type="password" placeholder="Password (opcional)"
                 class="h-10 px-3 rounded-lg bg-ink-800 border border-ink-700 text-label text-white
                        focus:outline-none focus:border-red-500 transition-colors"/>
        </div>
        @if (formError()) {
          <p class="text-caption text-red-400">{{ formError() }}</p>
        }
        <div class="flex gap-2">
          <button type="submit"
                  class="px-4 py-2 rounded-lg bg-red-500 text-white text-caption font-medium
                         hover:bg-red-600 transition-colors">
            Criar
          </button>
          <button type="button" (click)="showForm.set(false)"
                  class="px-4 py-2 rounded-lg bg-ink-800 text-ink-300 text-caption
                         hover:bg-ink-700 transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    }

    @if (loading()) {
      <div class="space-y-2">
        @for (i of [1,2,3]; track i) {
          <div class="h-14 rounded-lg bg-ink-900 animate-pulse"></div>
        }
      </div>
    } @else {
      <div class="rounded-xl bg-ink-900 overflow-hidden">
        <table class="w-full text-label">
          <thead>
            <tr class="border-b border-ink-800">
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium">Nome</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium hidden sm:table-cell">Email</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium">Perfil</th>
              <th class="text-left px-4 py-3 text-caption text-ink-500 font-medium hidden md:table-cell">Último login</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr class="border-b border-ink-800/50" [class.opacity-50]="!user.active">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center
                                text-[11px] font-bold text-red-400">
                      {{ initials(user.name) }}
                    </div>
                    <span class="text-white font-medium">{{ user.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-ink-400 hidden sm:table-cell">{{ user.email }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-medium {{ roleColor(user.role) }}">
                    {{ roleLabel(user.role) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-ink-600 text-caption hidden md:table-cell">
                  {{ user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    (click)="toggleActive(user)"
                    class="text-caption text-ink-500 hover:text-white transition-colors px-2 py-1
                           rounded bg-ink-800 hover:bg-ink-700"
                  >
                    {{ user.active ? 'Desativar' : 'Ativar' }}
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-4 py-12 text-center text-ink-500">Nenhum utilizador.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class UsersPage implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly loading = signal(true);
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly showForm = signal(false);
  protected readonly formError = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }

  private load() {
    this.http.get<{ data: AdminUser[] }>('/api/v1/admin/users').subscribe({
      next: (r) => { this.users.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected invite(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement).value;
    const payload: Record<string, string> = {
      name: get('name'),
      email: get('email'),
      role: get('role'),
    };
    const pw = get('password');
    if (pw) payload['password'] = pw;

    this.formError.set(null);
    this.http.post<AdminUser>('/api/v1/admin/users', payload).subscribe({
      next: (user) => {
        this.users.update((list) => [...list, user]);
        this.showForm.set(false);
        form.reset();
      },
      error: (err) => this.formError.set(err?.error?.detail ?? 'Erro ao criar utilizador.'),
    });
  }

  protected toggleActive(user: AdminUser) {
    this.http.patch(`/api/v1/admin/users/${user.id}`, { active: !user.active }).subscribe({
      next: () => this.users.update((list) =>
        list.map((u) => u.id === user.id ? { ...u, active: !user.active } : u),
      ),
    });
  }

  protected initials(name: string) {
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }
  protected roleLabel(r: string) { return ROLE_LABELS[r] ?? r; }
  protected roleColor(r: string) { return ROLE_COLORS[r] ?? 'bg-ink-700 text-ink-400'; }
  protected formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
