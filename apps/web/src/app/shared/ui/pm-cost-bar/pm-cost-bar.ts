import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'pm-cost-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between text-caption text-ink-400">
        <span>Capital</span>
        <span>Juros</span>
      </div>
      <div class="flex rounded-full overflow-hidden h-2 bg-ink-700">
        <div
          class="bg-red-500 transition-all duration-300"
          [style.width.%]="capitalPct()"
          [attr.aria-label]="'Capital: ' + capitalPct().toFixed(0) + '%'"
        ></div>
        <div
          class="bg-ink-500 transition-all duration-300"
          [style.width.%]="interestPct()"
          [attr.aria-label]="'Juros: ' + interestPct().toFixed(0) + '%'"
        ></div>
      </div>
      <div class="flex items-center justify-between text-caption text-ink-400">
        <span>{{ formatEur(principalCents()) }}</span>
        <span>{{ formatEur(interestCents()) }}</span>
      </div>
    </div>
  `,
})
export class PmCostBar {
  readonly principalCents = input.required<number>();
  readonly interestCents = input.required<number>();

  protected readonly capitalPct = computed(() => {
    const total = this.principalCents() + this.interestCents();
    return total === 0 ? 50 : (this.principalCents() / total) * 100;
  });

  protected readonly interestPct = computed(() => 100 - this.capitalPct());

  protected formatEur(cents: number): string {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
      .format(cents / 100);
  }
}
