import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'pm-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [ngClass]="classes()"
      class="inline-flex items-center justify-center gap-2 font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:pointer-events-none disabled:opacity-40 min-h-touch"
    >
      @if (loading()) {
        <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
        </svg>
      }
      <ng-content />
    </button>
  `,
})
export class PmButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);

  protected classes() {
    const v = this.variant();
    const s = this.size();
    return {
      'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 rounded-lg': v === 'primary',
      'bg-transparent text-ink-200 border border-ink-700 hover:bg-ink-850 active:bg-ink-800 rounded-lg': v === 'secondary',
      'bg-transparent text-red-400 hover:bg-[#1A0709] active:bg-red-950 rounded-lg': v === 'ghost',
      'bg-error text-white hover:opacity-90 rounded-lg': v === 'danger',
      'px-3 py-1.5 text-xs': s === 'sm',
      'px-4 py-2 text-sm': s === 'md',
      'px-6 py-3 text-base': s === 'lg',
    };
  }
}
