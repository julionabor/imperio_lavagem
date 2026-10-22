/**
 * Armazena ajustes individuais de simulação por viatura (entrada e prazo).
 * Usado pela gaveta do card pm-vehicle-card para calcular a prestação personalizada.
 */
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';

export interface CardSimulation {
  /** Entrada em cêntimos */
  downCents: number;
  /** Prazo em meses */
  termMonths: number;
}

interface CardSimulationState {
  simulations: Record<string, CardSimulation>;
}

export const CardSimulationStore = signalStore(
  { providedIn: 'root' },
  withState<CardSimulationState>({ simulations: {} }),
  withMethods((store) => ({
    set(vehicleId: string, sim: CardSimulation) {
      patchState(store, { simulations: { ...store.simulations(), [vehicleId]: sim } });
    },
    get(vehicleId: string): CardSimulation | null {
      return store.simulations()[vehicleId] ?? null;
    },
    clear(vehicleId: string) {
      const next = { ...store.simulations() };
      delete next[vehicleId];
      patchState(store, { simulations: next });
    },
  })),
);
