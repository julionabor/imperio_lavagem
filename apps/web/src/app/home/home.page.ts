import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pm-home-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-screen bg-ink-950 flex items-center justify-center px-6">
      <div class="text-center">
        <p class="text-overline font-sans uppercase tracking-[0.14em] text-red-400 mb-4">
          Em construção
        </p>
        <h1 class="text-display-xl font-display font-bold text-white">
          Private Motors
        </h1>
        <p class="text-body-lg text-ink-400 mt-4">
          Brevemente o melhor stock automóvel ao seu alcance.
        </p>
      </div>
    </main>
  `,
})
export class HomePage {}
