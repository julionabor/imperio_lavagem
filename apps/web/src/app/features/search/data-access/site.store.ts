import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { SiteApi, type SiteData, type AssistantSettings } from './site.api';
import type { FinancingProduct } from '@pm/libs/contracts';

interface SiteState {
  data: SiteData | null;
  loading: boolean;
  error: string | null;
}

const initialState: SiteState = {
  data: null,
  loading: false,
  error: null,
};

export const SiteStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    settings: () => store.data()?.settings ?? null,
    homeContent: () => store.data()?.homeContent ?? null,
    nav: () => store.data()?.nav ?? [],
    advantages: () => store.data()?.advantages ?? [],
    testimonials: () => store.data()?.testimonials ?? [],
    quickFilters: () => store.data()?.quickFilters ?? [],
    searchExamples: () => store.data()?.searchExamples ?? [],
    stockCount: () => store.data()?.stockCount ?? 0,
    financingProduct: (): FinancingProduct | null => store.data()?.financingProduct ?? null,
    parserDictionary: () => store.data()?.parserDictionary ?? null,
    assistantSettings: (): AssistantSettings | null => store.data()?.assistantSettings ?? null,
  })),
  withMethods((store, api = inject(SiteApi)) => ({
    load: rxMethod<void>(
      pipe(
        switchMap(() => {
          patchState(store, { loading: true, error: null });
          return api.getSiteData().pipe(
            tap((data: SiteData) => patchState(store, { data, loading: false })),
            catchError((e: unknown) => {
              patchState(store, {
                loading: false,
                error: e instanceof Error ? e.message : 'Erro ao carregar dados do site',
              });
              return EMPTY;
            }),
          );
        }),
      ),
    ),
  })),
);
