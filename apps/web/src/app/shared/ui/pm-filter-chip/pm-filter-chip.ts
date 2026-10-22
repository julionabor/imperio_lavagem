import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'pm-filter-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
             bg-ink-700 border border-ink-600 text-label text-white
             min-h-[touch] select-none"
    >
      {{ label() }}
      <button
        type="button"
        (click)="removed.emit()"
        class="flex items-center justify-center w-4 h-4 rounded-full
               text-ink-400 hover:text-white hover:bg-ink-500
               focus:outline-none focus:ring-1 focus:ring-red-500/60"
        [attr.aria-label]="'Remover filtro ' + label()"
      >
        <svg viewBox="0 0 12 12" class="w-3 h-3" fill="none">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round"/>
        </svg>
      </button>
    </span>
  `,
})
export class PmFilterChip {
  readonly label = input.required<string>();
  readonly removed = output<void>();
}
