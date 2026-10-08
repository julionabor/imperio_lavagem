import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'pm-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" [class]="colorClass()">
      <ng-content />
    </span>
  `,
})
export class PmBadge {
  readonly variant = input<BadgeVariant>('neutral');

  protected colorClass() {
    const map: Record<BadgeVariant, string> = {
      success: 'bg-success-bg text-success',
      warning: 'bg-warning-bg text-warning',
      error: 'bg-error-bg text-error',
      info: 'bg-info-bg text-info',
      neutral: 'bg-ink-800 text-ink-300',
    };
    return map[this.variant()];
  }
}
