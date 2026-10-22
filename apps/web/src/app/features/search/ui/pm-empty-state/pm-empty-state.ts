/**
 * Estado vazio: sem resultados com sugestões + "Pedimos o carro por si".
 */
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import type { VehicleSuggestion } from '../../data-access/vehicles.api';

@Component({
  selector: 'pm-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mt-3 p-7 sm:p-10 rounded-[18px] bg-ink-950
             shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.08)]
             grid gap-5 max-w-[760px] animate-[pmUp_.25s_ease]"
    >
      <!-- ícone -->
      <div class="w-12 h-12 rounded-xl bg-red-950 text-red-400 text-2xl
                  flex items-center justify-center">
        <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none">
          <path d="M5 11H3l1-3h12l1 3h-2M5 11v5h14v-5M5 11h14" stroke="currentColor"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor"/>
          <circle cx="16.5" cy="17.5" r="1.5" fill="currentColor"/>
        </svg>
      </div>

      <!-- texto -->
      <div class="grid gap-2">
        <h3 class="font-display font-semibold text-[24px] tracking-[-0.02em] m-0">
          Nenhuma viatura com esta combinação
        </h3>
        <p class="text-body text-ink-300 m-0">
          Mas estamos perto. Qualquer uma destas alterações devolve resultados:
        </p>
      </div>

      <!-- sugestões -->
      @if (suggestions().length) {
        <div class="grid gap-2">
          @for (s of suggestions(); track s.label) {
            <button
              type="button"
              (click)="suggestionSelected.emit(s)"
              class="min-h-[52px] flex items-center justify-between gap-3 px-4 rounded-xl
                     bg-ink-850 text-white text-label font-medium text-left
                     shadow-[inset_0_0_0_1px_rgb(237_237_240_/_0.08)]
                     hover:shadow-[inset_0_0_0_1px_#d0161f] hover:bg-red-950/60
                     focus:outline-none focus:ring-2 focus:ring-red-500/40
                     transition-all"
            >
              <span>{{ s.label }}</span>
              <span class="text-red-400 whitespace-nowrap flex items-center gap-1.5 tabular-nums">
                {{ s.count }} viaturas
                <svg viewBox="0 0 16 16" class="w-4 h-4" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>
          }
        </div>
      }

      <!-- rodapé -->
      <div class="flex flex-wrap gap-3 items-center text-[14px] text-ink-400">
        <span>Não encontra o que quer?</span>
        <button
          type="button"
          (click)="assistantRequested.emit()"
          class="min-h-[touch] px-4 rounded-md border-0 bg-transparent
                 text-red-400 text-label font-medium
                 shadow-[inset_0_0_0_1px_#8c0f15]
                 hover:bg-red-950/60
                 focus:outline-none focus:ring-2 focus:ring-red-500/40
                 transition-colors"
        >
          Pedimos o carro por si
        </button>
        <button
          type="button"
          (click)="cleared.emit()"
          class="min-h-[touch] px-3 rounded-md border-0 bg-transparent
                 text-ink-300 text-label font-medium
                 hover:text-white
                 focus:outline-none
                 transition-colors"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  `,
})
export class PmEmptyState {
  readonly suggestions = input<VehicleSuggestion[]>([]);

  readonly suggestionSelected = output<VehicleSuggestion>();
  readonly assistantRequested = output<void>();
  readonly cleared = output<void>();
}
