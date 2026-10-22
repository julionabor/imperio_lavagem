import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'pm-skeleton-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="rounded-lg overflow-hidden bg-ink-850 shadow-card animate-pulse"
      aria-hidden="true"
    >
      <!-- imagem -->
      <div class="aspect-[4/3] bg-ink-700"></div>

      <!-- corpo -->
      <div class="p-4 flex flex-col gap-3">
        <!-- marca/modelo -->
        <div class="flex flex-col gap-1.5">
          <div class="h-4 w-1/3 rounded bg-ink-700"></div>
          <div class="h-5 w-2/3 rounded bg-ink-700"></div>
        </div>

        <!-- specs -->
        <div class="flex gap-3">
          <div class="h-3.5 w-12 rounded bg-ink-700"></div>
          <div class="h-3.5 w-16 rounded bg-ink-700"></div>
          <div class="h-3.5 w-10 rounded bg-ink-700"></div>
        </div>

        <!-- preço -->
        <div class="flex items-end justify-between mt-1">
          <div class="h-7 w-24 rounded bg-ink-700"></div>
          <div class="h-4 w-20 rounded bg-ink-700"></div>
        </div>
      </div>
    </article>
  `,
})
export class PmSkeletonCard {}
