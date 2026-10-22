import { Component, ChangeDetectionStrategy, input, model } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'pm-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      @if (label()) {
        <label class="block text-caption text-ink-400 mb-1">{{ label() }}</label>
      }
      <div class="relative">
        <select
          [value]="value() ?? ''"
          (change)="onSelect($event)"
          class="w-full appearance-none bg-ink-800 border border-ink-700 rounded-md
                 text-label text-white pl-3 pr-8 py-2.5 cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500
                 min-h-[44px]"
          [attr.aria-label]="label()"
        >
          @if (placeholder()) {
            <option value="">{{ placeholder() }}</option>
          }
          @for (opt of options(); track opt.value) {
            <option [value]="opt.value">
              {{ opt.label }}{{ opt.count !== undefined ? ' (' + opt.count + ')' : '' }}
            </option>
          }
        </select>
        <svg
          class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"
          viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  `,
})
export class PmSelect {
  readonly label = input<string>('');
  readonly placeholder = input<string>('Todos');
  readonly options = input<SelectOption[]>([]);
  readonly value = model<string | null>(null);

  protected onSelect(e: Event) {
    const v = (e.target as HTMLSelectElement).value || null;
    this.value.set(v);
  }
}
