import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { DashboardApi, type DashboardSummary } from './dashboard.api';

interface DashboardState {
  summary: DashboardSummary | null;
  loading: boolean;
}

export const DashboardStore = signalStore(
  withState<DashboardState>({ summary: null, loading: false }),
  withMethods((store, api = inject(DashboardApi)) => ({
    async load(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const summary = await firstValueFrom(api.getSummary());
        patchState(store, { summary, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },
  })),
);
