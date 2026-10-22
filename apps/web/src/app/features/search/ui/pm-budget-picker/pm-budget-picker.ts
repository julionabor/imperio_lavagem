/**
 * Painel do modo orçamento: prestação, entrada e prazo.
 * Mostra contagem de "cabem" e "ficam perto".
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  model,
  signal,
  computed,
} from '@angular/core';
import { PmTermTicks } from '../../../../shared/ui/pm-term-ticks/pm-term-ticks';
import { formatEur, formatBp } from '../../../../shared/util/format';

export interface BudgetParams {
  budget: number;  // prestação mensal máxima em cêntimos
  down: number;    // entrada em cêntimos
  term: number;    // prazo em meses
}

@Component({
  selector: 'pm-budget-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PmTermTicks],
  template: `
    <div class="grid gap-3.5 min-w-0 animate-[pmUp_.25s_ease]">
      <!-- sliders num grid responsivo -->
      <div
        class="grid gap-px
               grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]
               bg-ink-100/8 rounded-[18px] overflow-hidden
               shadow-[0_30px_80px_-30px_rgb(208_22_31_/_0.45)]"
      >
        <!-- prestação -->
        <div class="bg-ink-900 p-5 grid gap-1.5">
          <p class="text-[13px] text-ink-400">Posso pagar por mês</p>
          <p class="font-display font-bold text-[44px] leading-none tracking-[-0.03em] tabular-nums">
            {{ budgetLabel() }}
          </p>
          <input
            type="range" min="10000" max="90000" step="1000"
            [value]="budget()"
            (input)="onBudget($event)"
            aria-label="Prestação mensal máxima"
            class="w-full"
          />
          <div class="flex justify-between text-[11px] text-ink-600">
            <span>100 €</span><span>900 €</span>
          </div>
        </div>

        <!-- entrada -->
        <div class="bg-ink-900 p-5 grid gap-1.5">
          <p class="text-[13px] text-ink-400">
            Entrada disponível <span class="text-ink-600">(opcional)</span>
          </p>
          <p class="font-display font-semibold text-[32px] leading-[1.2] tracking-[-0.02em] tabular-nums">
            {{ downLabel() }}
          </p>
          <input
            type="range" min="0" max="2000000" step="50000"
            [value]="down()"
            (input)="onDown($event)"
            aria-label="Entrada"
            class="w-full"
          />
          <div class="flex justify-between text-[11px] text-ink-600">
            <span>Sem entrada</span><span>20 000 €</span>
          </div>
        </div>

        <!-- prazo -->
        <div class="bg-ink-900 p-5 grid gap-2.5 content-start">
          <p class="text-[13px] text-ink-400">Prazo</p>
          <p class="font-display font-semibold text-[32px] leading-[1.2] tracking-[-0.02em]">
            {{ term() }} meses
          </p>
          <pm-term-ticks
            [value]="term()"
            (valueChange)="onTerm($event)"
          />
        </div>
      </div>

      <!-- sumário cabem / ficam perto -->
      @if (fitCount() !== null || nearCount() !== null) {
        <div class="flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-ink-300 items-center">
          @if (fitCount() !== null) {
            <span class="flex items-center gap-2">
              <svg viewBox="0 0 20 20" class="w-5 h-5 text-success shrink-0" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4Z" clip-rule="evenodd"/>
              </svg>
              <strong class="text-white font-semibold">{{ fitCount() }}</strong> cabem no orçamento
            </span>
          }
          @if (nearCount() !== null) {
            <span class="flex items-center gap-2">
              <svg viewBox="0 0 20 20" class="w-5 h-5 text-warning shrink-0" fill="currentColor">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>
              </svg>
              <strong class="text-white font-semibold">{{ nearCount() }}</strong> ficam perto (até 15% acima)
            </span>
          }
          @if (taegBp()) {
            <span class="text-ink-600">TAEG {{ formatBp(taegBp()!) }} · valores indicativos</span>
          }
        </div>
      }
    </div>
  `,
})
export class PmBudgetPicker {
  readonly budget = input<number>(30000);  // 300 €/mês em cêntimos
  readonly down = input<number>(0);
  readonly term = input<number>(96);
  readonly fitCount = input<number | null>(null);
  readonly nearCount = input<number | null>(null);
  readonly taegBp = input<number | null>(null);

  readonly budgetChange = output<number>();
  readonly downChange = output<number>();
  readonly termChange = output<number>();

  protected readonly budgetLabel = computed(() => formatEur(this.budget()));
  protected readonly downLabel = computed(() =>
    this.down() === 0 ? 'Sem entrada' : formatEur(this.down()),
  );

  protected onBudget(e: Event) {
    this.budgetChange.emit(Number((e.target as HTMLInputElement).value));
  }

  protected onDown(e: Event) {
    this.downChange.emit(Number((e.target as HTMLInputElement).value));
  }

  protected onTerm(v: number) {
    this.termChange.emit(v);
  }

  protected readonly formatBp = formatBp;
}
