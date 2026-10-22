import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { NavItem, SiteSettings } from '../../../features/search/data-access/site.api';

@Component({
  selector: 'pm-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header
      class="sticky top-0 z-30 border-b border-ink-100/[0.06]
             bg-ink-950/82 backdrop-blur-[14px]"
    >
      <div class="max-w-[--container-page] mx-auto px-6 h-[68px] flex items-center gap-7">
        <!-- logo -->
        <a
          routerLink="/"
          class="flex items-center gap-2.5 mr-auto no-underline
                 focus:outline-none focus:ring-2 focus:ring-red-500/40 rounded-sm"
          aria-label="Private Motors — página inicial"
        >
          <span class="w-[9px] h-6 bg-red-500 rounded-sm" style="transform:skewX(-16deg)"></span>
          <span class="font-display font-black text-[17px] tracking-[.01em]">
            PRIVATE<span class="text-red-400 font-medium"> MOTORS</span>
          </span>
        </a>

        <!-- nav desktop -->
        <nav class="hidden lg:flex gap-1 whitespace-nowrap" aria-label="Navegação principal">
          @for (item of nav(); track item.id) {
            @if (item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="text-white bg-ink-800"
                class="min-h-[touch] px-3.5 rounded-md flex items-center text-label text-ink-300
                       hover:text-white hover:bg-ink-800
                       focus:outline-none focus:ring-2 focus:ring-red-500/40
                       transition-colors no-underline"
              >{{ item.label }}</a>
            } @else if (item.url) {
              <a
                [href]="item.url"
                target="_blank" rel="noopener"
                class="min-h-[touch] px-3.5 rounded-md flex items-center text-label text-ink-300
                       hover:text-white hover:bg-ink-800
                       focus:outline-none focus:ring-2 focus:ring-red-500/40
                       transition-colors no-underline"
              >{{ item.label }}</a>
            }
          }
        </nav>

        <!-- telefone desktop -->
        @if (settings()?.phones?.length) {
          <a
            [href]="'tel:' + settings()!.phones[0].replace(/\s/g, '')"
            class="hidden lg:flex items-center gap-2 text-ink-300 text-label no-underline
                   min-h-[touch] whitespace-nowrap tabular-nums
                   hover:text-white transition-colors"
          >
            <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
              <path d="M3 5a2 2 0 0 1 2-2h1.5a1 1 0 0 1 .95.68l.95 2.86a1 1 0 0 1-.23 1.03L7 8.7c1.07 1.94 2.36 3.23 4.3 4.3l1.13-1.17a1 1 0 0 1 1.03-.23l2.86.95A1 1 0 0 1 17 13.5V15a2 2 0 0 1-2 2h-.5C7.3 17 3 12.7 3 7.5V5Z"
                    stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            {{ settings()!.phones[0] }}
          </a>
        }

        <!-- CTA falar connosco -->
        <button
          type="button"
          (click)="assistantOpened.emit()"
          class="hidden lg:flex items-center gap-2 min-h-[touch] px-4 rounded-md border-0 bg-transparent
                 text-white text-label font-medium whitespace-nowrap
                 shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.18)]
                 hover:bg-ink-850
                 focus:outline-none focus:ring-2 focus:ring-red-500/40
                 transition-colors"
        >
          <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none">
            <path d="M2 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6l-4 2V6Z"
                  stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          Falar connosco
        </button>

        <!-- hamburger mobile -->
        <button
          type="button"
          (click)="mobileOpen.update((v) => !v)"
          [attr.aria-expanded]="mobileOpen()"
          aria-label="Menu"
          class="lg:hidden w-11 h-11 rounded-md flex items-center justify-center
                 bg-ink-850 text-white text-[20px]
                 focus:outline-none focus:ring-2 focus:ring-red-500/40"
        >
          @if (mobileOpen()) {
            <svg viewBox="0 0 20 20" class="w-5 h-5" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          } @else {
            <svg viewBox="0 0 20 20" class="w-5 h-5" fill="none">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          }
        </button>
      </div>

      <!-- nav mobile dropdown -->
      @if (mobileOpen()) {
        <nav
          class="lg:hidden grid gap-0.5 px-4 pb-5 pt-2 animate-[pmUp_.2s_ease]"
          aria-label="Menu mobile"
        >
          @for (item of nav(); track item.id) {
            @if (item.route) {
              <a
                [routerLink]="item.route"
                (click)="mobileOpen.set(false)"
                class="min-h-[48px] flex items-center px-3 rounded-md
                       text-white text-body no-underline
                       hover:bg-ink-850
                       focus:outline-none focus:ring-2 focus:ring-red-500/40"
              >{{ item.label }}</a>
            } @else if (item.url) {
              <a
                [href]="item.url"
                target="_blank" rel="noopener"
                class="min-h-[48px] flex items-center px-3 rounded-md
                       text-white text-body no-underline
                       hover:bg-ink-850
                       focus:outline-none focus:ring-2 focus:ring-red-500/40"
              >{{ item.label }}</a>
            }
          }
          <button
            type="button"
            (click)="assistantOpened.emit(); mobileOpen.set(false)"
            class="min-h-[48px] flex items-center gap-2 px-3 rounded-md border-0 bg-transparent
                   text-white text-body text-left
                   hover:bg-ink-850
                   focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            Falar connosco
          </button>
        </nav>
      }
    </header>
  `,
})
export class PmHeader {
  readonly nav = input<NavItem[]>([]);
  readonly settings = input<SiteSettings | null>(null);

  readonly assistantOpened = output<void>();

  protected readonly mobileOpen = signal(false);
}
