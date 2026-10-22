/**
 * Gaveta de simulação inline dentro do card de viatura.
 * Mostra slider de entrada, ticks de prazo e barra capital/juros.
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import type { FinancingProduct } from '@pm/libs/contracts';
import { FinanceService } from '../../../../core/services/finance.service';
import { formatEur, formatBp } from '../../../../shared/util/format';
import { PmSlider } from '../../../../shared/ui/pm-slider/pm-slider';
import { PmTermTicks } from '../../../../shared/ui/pm-term-ticks/pm-term-ticks';

@Component({
  selector: 'pm-finance-inline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PmSlider, PmTermTicks],
  template: `
    <div class="grid gap-3 p-3.5 rounded-xl bg-ink-850 animate-[pmUp_.22s_ease]">
      <!-- slider entrada -->
      <pm-slider
        label="Entrada"
        [min]="0"
        [max]="entryMax()"
        [step]="500"
        [value]="downCentsValue()"
        [format]="formatEurFn"
        (valueChange)="downCents.emit($event)"
      />

      <!-- ticks prazo -->
      <pm-term-ticks
        [terms]="product().allowedTerms"
        [value]="termMonthsValue()"
        (valueChange)="termMonths.emit($event)"
      />

      <!-- barra capital / juros -->
      @if (sim(); as s) {
        <div class="grid gap-1.5">
          <div class="flex h-2 rounded-full overflow-hidden bg-ink-700">
            <div
              class="bg-ink-200 transition-all duration-300"
              [style.width.%]="capPct()"
            ></div>
            <div
              class="bg-red-500 transition-all duration-300"
              [style.width.%]="100 - capPct()"
            ></div>
          </div>
          <div class="flex flex-wrap gap-x-3.5 gap-y-1 text-caption text-ink-400 tabular-nums">
            <span>
              <span class="inline-block w-2 h-2 rounded-sm bg-ink-200 mr-1"></span>
              Capital {{ formatEur(s.principalCents) }}
            </span>
            <span>
              <span class="inline-block w-2 h-2 rounded-sm bg-red-500 mr-1"></span>
              Juros {{ formatEur(s.interestCents) }}
            </span>
            <span>MTIC {{ formatEur(s.mticCents) }}</span>
          </div>
        </div>
        <p class="text-[11px] leading-snug text-ink-500">
          TAEG {{ formatBp(sim()!.taegBp) }}. Simulação indicativa, sujeita a aprovação.
        </p>
      }
    </div>
  `,
})
export class PmFinanceInline {
  readonly product = input.required<FinancingProduct>();
  readonly priceCents = input.required<number>();
  readonly downCents = output<number>();
  readonly termMonths = output<number>();

  // valores atuais passados pelo pai
  readonly downCentsValue = input<number>(0);
  readonly termMonthsValue = input<number>(96);

  private readonly financeService = inject(FinanceService);

  protected readonly entryMax = computed(() =>
    Math.floor(this.priceCents() * (this.product().maxDownPaymentPct / 100) / 500) * 500,
  );

  protected readonly sim = computed(() => {
    try {
      return this.financeService.simulate(
        this.product(),
        this.priceCents(),
        this.downCentsValue(),
        this.termMonthsValue(),
      );
    } catch {
      return null;
    }
  });

  protected readonly capPct = computed(() => {
    const s = this.sim();
    if (!s) return 50;
    const total = s.principalCents + s.interestCents;
    return total === 0 ? 50 : (s.principalCents / total) * 100;
  });

  protected readonly formatEurFn = (v: number) => formatEur(v);
  protected readonly formatEur = formatEur;
  protected readonly formatBp = formatBp;
}
