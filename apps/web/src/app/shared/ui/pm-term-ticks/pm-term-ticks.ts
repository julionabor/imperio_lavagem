import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'pm-term-ticks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label()) {
        <span class="text-label text-ink-400">{{ label() }}</span>
      }
      <div class="flex flex-wrap gap-1.5" role="radiogroup" [attr.aria-label]="label()">
        @for (t of terms(); track t) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="value() === t"
            (click)="valueChange.emit(t)"
            class="px-3 py-1.5 rounded-md text-label min-h-[36px] transition-colors
                   focus:outline-none focus:ring-2 focus:ring-red-500/40"
            [class]="value() === t
              ? 'bg-red-500 text-white'
              : 'bg-ink-800 border border-ink-700 text-ink-300 hover:border-ink-500 hover:text-white'"
          >
            {{ t }} m
          </button>
        }
      </div>
    </div>
  `,
})
export class PmTermTicks {
  readonly label = input<string>('Prazo');
  readonly terms = input<number[]>([24, 36, 48, 60, 72, 84, 96]);
  readonly value = input<number>(96);
  readonly valueChange = output<number>();
}
