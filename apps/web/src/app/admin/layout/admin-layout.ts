import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { PmToastContainer } from '../../shared/ui/pm-toast/pm-toast';
import { PmConfirmDialog } from '../../shared/ui/pm-confirm-dialog/pm-confirm-dialog';

interface NavItem { label: string; route: string; icon: string; roles?: string[]; }

const NAV: NavItem[] = [
  { label: 'Dashboard', route: '/admin', icon: 'grid-four' },
  { label: 'Viaturas', route: '/admin/viaturas', icon: 'car' },
  { label: 'Catálogos', route: '/admin/catalogos/marcas', icon: 'books' },
  { label: 'Financiamento', route: '/admin/financiamento', icon: 'percent', roles: ['ADMIN', 'EDITOR'] },
  { label: 'Conteúdo', route: '/admin/conteudo/home', icon: 'pencil-simple', roles: ['ADMIN', 'EDITOR'] },
  { label: 'Leads', route: '/admin/crm', icon: 'users' },
  { label: 'Destaques', route: '/admin/destaques/home', icon: 'star', roles: ['ADMIN', 'EDITOR'] },
  { label: 'Definições', route: '/admin/definicoes', icon: 'gear', roles: ['ADMIN'] },
  { label: 'Utilizadores', route: '/admin/utilizadores', icon: 'user-circle', roles: ['ADMIN'] },
];

@Component({
  selector: 'pm-admin-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PmToastContainer, PmConfirmDialog],
  template: `
    <div class="flex h-screen bg-ink-950 text-ink-100">
      <!-- Sidebar -->
      <aside
        class="flex w-60 shrink-0 flex-col border-r border-ink-800 bg-ink-900"
        [class.hidden]="!sidebarOpen()"
        [class.lg:flex]="true"
      >
        <div class="flex h-14 items-center px-4 border-b border-ink-800">
          <span class="font-display font-semibold text-ink-100">Private Motors</span>
        </div>

        <nav class="flex-1 overflow-y-auto py-4 px-2">
          @for (item of visibleNav(); track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-ink-850 text-ink-100"
              [routerLinkActiveOptions]="{ exact: item.route === '/admin' }"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-200 mb-0.5"
            >
              <span class="text-base">{{ iconMap[item.icon] }}</span>
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="border-t border-ink-800 p-3">
          <div class="flex items-center gap-3 rounded-lg px-3 py-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 text-xs font-medium text-ink-200">
              {{ initials() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="truncate text-sm font-medium text-ink-200">{{ store.userName() }}</p>
              <p class="truncate text-xs text-ink-500">{{ store.role() }}</p>
            </div>
            <button
              (click)="store.logout()"
              class="text-ink-500 hover:text-error transition-colors"
              title="Sair"
            >⏻</button>
          </div>
        </div>
      </aside>

      <!-- Conteúdo principal -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Header mobile -->
        <header class="flex h-14 items-center gap-3 border-b border-ink-800 bg-ink-900 px-4 lg:hidden">
          <button
            (click)="sidebarOpen.set(!sidebarOpen())"
            class="text-ink-400 hover:text-ink-100"
          >☰</button>
          <span class="font-display font-semibold text-ink-100">Private Motors</span>
        </header>

        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
    <pm-toast-container />
    <pm-confirm-dialog />
  `,
})
export class AdminLayout {
  protected readonly store = inject(AuthStore);
  protected readonly sidebarOpen = signal(false);

  protected readonly iconMap: Record<string, string> = {
    'grid-four': '⊞', car: '🚗', books: '📚', percent: '%', pencil: '✏️',
    'pencil-simple': '✏️', users: '👥', star: '⭐', gear: '⚙️', 'user-circle': '👤',
  };

  protected visibleNav() {
    const role = this.store.role();
    if (!role) return [];
    return NAV.filter((n) => !n.roles || n.roles.includes(role));
  }

  protected initials() {
    return (this.store.userName() || 'U').slice(0, 2).toUpperCase();
  }
}
