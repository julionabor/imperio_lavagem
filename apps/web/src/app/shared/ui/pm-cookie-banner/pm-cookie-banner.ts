import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

const CONSENT_KEY = 'pm-cookie-consent';

@Component({
  selector: 'pm-cookie-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (visible()) {
      <div
        role="dialog"
        aria-label="Aviso de cookies"
        aria-live="polite"
        class="fixed bottom-0 left-0 right-0 z-50
               bg-ink-900 border-t border-ink-800
               shadow-[0_-4px_24px_rgb(0_0_0_/_0.4)]
               px-4 py-5 sm:px-6"
      >
        <div class="max-w-[--container-page] mx-auto
                    flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <p class="text-[14px] text-ink-300 leading-relaxed flex-1 text-pretty">
            Usamos cookies essenciais para o funcionamento do site e, com o seu consentimento,
            cookies analíticos para melhorar a experiência.
            <a routerLink="/cookies"
               class="text-red-400 underline hover:text-red-300 ml-1">
              Política de cookies
            </a>
          </p>
          <div class="flex gap-3 shrink-0">
            <button
              type="button"
              (click)="accept('essential')"
              class="min-h-[40px] px-4 rounded-lg border-0 text-label font-medium
                     bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-white
                     transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
            >
              Apenas essenciais
            </button>
            <button
              type="button"
              (click)="accept('all')"
              class="min-h-[40px] px-5 rounded-lg border-0 text-label font-semibold
                     bg-red-500 text-white hover:bg-red-600
                     transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
            >
              Aceitar tudo
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PmCookieBanner implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly visible = signal(false);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        this.visible.set(true);
      }
    }
  }

  protected accept(level: 'all' | 'essential') {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(CONSENT_KEY, level);
    }
    this.visible.set(false);
  }
}
