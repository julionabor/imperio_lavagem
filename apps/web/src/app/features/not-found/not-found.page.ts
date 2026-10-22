import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteStore } from '../search/data-access/site.store';
import { PmHeader } from '../../core/layout/pm-header/pm-header';
import { PmFooter } from '../../core/layout/pm-footer/pm-footer';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'pm-not-found-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PmHeader, PmFooter],
  template: `
    <pm-header [nav]="siteStore.nav()" [settings]="siteStore.settings()" />

    <main class="min-h-[70vh] bg-ink-950 text-white flex flex-col items-center justify-center
                 px-6 py-20 text-center gap-6">
      <p class="text-[80px] font-display font-black leading-none text-ink-800 select-none">
        404
      </p>
      <h1 class="text-h1 font-display font-black text-balance">
        Página não encontrada
      </h1>
      <p class="text-ink-400 max-w-md text-pretty">
        A página que procura não existe ou foi removida.
        Explore o nosso stock de viaturas usadas.
      </p>
      <div class="flex flex-wrap gap-3 justify-center">
        <a routerLink="/"
           class="min-h-[48px] px-6 rounded-xl border-0 flex items-center gap-2
                  bg-red-500 hover:bg-red-600 text-white text-label font-semibold
                  no-underline transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40">
          Ver stock disponível
        </a>
        <a routerLink="/" [queryParams]="{ sort: 'NEWEST' }"
           class="min-h-[48px] px-6 rounded-xl flex items-center
                  bg-ink-850 hover:bg-ink-800 text-white text-label font-medium
                  shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.1)]
                  no-underline transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40">
          Viaturas mais recentes
        </a>
      </div>
    </main>

    <pm-footer [nav]="siteStore.nav()" [settings]="siteStore.settings()" />
  `,
})
export class NotFoundPage {
  protected readonly siteStore = inject(SiteStore);
  private readonly seo = inject(SeoService);

  constructor() {
    this.seo.set({
      title: 'Página não encontrada | Private Motors',
      description: 'Esta página não existe. Explore o stock de viaturas usadas da Private Motors.',
      path: '/',
    });
  }
}
