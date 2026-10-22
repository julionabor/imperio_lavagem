import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { NavItem, SiteSettings } from '../../../features/search/data-access/site.api';

@Component({
  selector: 'pm-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer class="border-t border-ink-100/[0.08] bg-[#050506]">
      <div class="max-w-[--container-page] mx-auto px-6 pt-12 pb-8 grid gap-8">
        <!-- grid de colunas -->
        <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-7">
          <!-- logo + morada -->
          <div class="grid gap-3 content-start">
            <div class="flex items-center gap-2.5">
              <span class="w-[9px] h-6 bg-red-500 rounded-sm" style="transform:skewX(-16deg)"></span>
              <span class="font-display font-black text-[17px] tracking-[.01em]">
                PRIVATE<span class="text-red-400 font-medium"> MOTORS</span>
              </span>
            </div>
            @if (settings()) {
              <p class="m-0 text-[14px] leading-relaxed text-ink-400">
                {{ settings()!.address }}<br>
                {{ settings()!.postalCode }} {{ settings()!.locality }}
              </p>
            }
          </div>

          <!-- horário -->
          @if (settings()?.openingHours) {
            <div class="grid gap-2 content-start text-[14px] text-ink-400">
              <span class="text-white font-semibold">Horário</span>
              @for (entry of openingHoursEntries(); track entry.day) {
                <span>{{ entry.day }} · {{ entry.hours }}</span>
              }
            </div>
          }

          <!-- navegação -->
          <div class="grid gap-1 content-start text-[14px]">
            <span class="text-white font-semibold mb-1">Stand</span>
            @for (item of nav(); track item.id) {
              @if (item.route) {
                <a
                  [routerLink]="item.route"
                  class="text-ink-400 no-underline min-h-[28px] flex items-center
                         hover:text-white transition-colors"
                >{{ item.label }}</a>
              } @else if (item.url) {
                <a
                  [href]="item.url"
                  target="_blank" rel="noopener"
                  class="text-ink-400 no-underline min-h-[28px] flex items-center
                         hover:text-white transition-colors"
                >{{ item.label }}</a>
              }
            }
          </div>

          <!-- contactos -->
          @if (settings()) {
            <div class="grid gap-2 content-start text-[14px] text-ink-400">
              <span class="text-white font-semibold">Contactos</span>
              @for (phone of settings()!.phones; track phone) {
                <span class="tabular-nums">{{ phone }}</span>
              }
              @if (settings()!.email) {
                <span>{{ settings()!.email }}</span>
              }
              <div class="flex gap-1.5 mt-1">
                @if (settings()!.whatsapp) {
                  <a
                    [href]="'https://wa.me/' + settings()!.whatsapp"
                    target="_blank" rel="noopener"
                    aria-label="WhatsApp"
                    class="w-11 h-11 rounded-md bg-ink-850 flex items-center justify-center
                           text-white text-[20px]
                           hover:bg-ink-800 transition-colors no-underline
                           focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  >
                    <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </a>
                }
              </div>
            </div>
          }
        </div>

        <!-- rodapé legal -->
        <div class="flex flex-wrap gap-2 gap-x-6 text-[12px] text-ink-600
                    pt-5 border-t border-ink-100/[0.06]">
          <span>© {{ year }} {{ settings()?.companyName ?? 'Private Motors' }}</span>
          <span>Intermediário de crédito a título acessório</span>
          @if (settings()?.complaintsBookUrl) {
            <a
              [href]="settings()!.complaintsBookUrl!"
              target="_blank" rel="noopener"
              class="text-ink-600 hover:text-ink-300 no-underline transition-colors"
            >Livro de reclamações</a>
          }
          <a routerLink="/privacidade" class="text-ink-600 hover:text-ink-300 no-underline transition-colors">
            Privacidade
          </a>
        </div>
      </div>
    </footer>
  `,
})
export class PmFooter {
  readonly nav = input<NavItem[]>([]);
  readonly settings = input<SiteSettings | null>(null);

  protected readonly year = new Date().getFullYear();

  protected openingHoursEntries(): { day: string; hours: string }[] {
    const oh = this.settings()?.openingHours;
    if (!oh || typeof oh !== 'object') return [];
    return Object.entries(oh as Record<string, string>).map(([day, hours]) => ({ day, hours }));
  }
}
