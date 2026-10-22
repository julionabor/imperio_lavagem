import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
} from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, debounceTime, tap, catchError, EMPTY } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { VehiclesApi, type VehicleListItem, type VehicleListResult, type FacetCounts } from './vehicles.api';
import { parse } from '@pm/libs/search-parser';
import type { FilterState } from '@pm/libs/contracts';

export type SearchMode = 'car' | 'budget';
export type SortKey = 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'MILEAGE_ASC' | 'YEAR_DESC';

// Re-export for convenience
export type { FilterState };

export interface ActiveFilters {
  brand?: string;
  model?: string;
  priceMax?: number;
  yearMin?: number;
  kmMax?: number;
  fuel?: string;
  bodyType?: string;
  transmission?: string;
  // budget mode
  budget?: number;
  down?: number;
  term?: number;
}

interface SearchState {
  mode: SearchMode;
  query: string;
  parsed: FilterState | null;
  filters: ActiveFilters;
  sort: SortKey;
  page: number;
  pageSize: number;
  vehicles: VehicleListItem[];
  total: number;
  totalPages: number;
  facets: FacetCounts;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: SearchState = {
  mode: 'car',
  query: '',
  parsed: null,
  filters: {},
  sort: 'NEWEST',
  page: 1,
  pageSize: 9,
  vehicles: [],
  total: 0,
  totalPages: 0,
  facets: { fuel: {}, body: {} },
  loading: false,
  error: null,
  initialized: false,
};

export const SearchStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasResults: () => store.vehicles().length > 0,
    isEmpty: () => store.initialized() && !store.loading() && store.vehicles().length === 0,
    activeFilterCount: () => {
      const f = store.filters();
      return Object.values(f).filter((v) => v !== undefined && v !== null && v !== '').length;
    },
  })),
  withMethods((store, api = inject(VehiclesApi), router = inject(Router)) => {
    const fetchVehicles = rxMethod<void>(
      pipe(
        debounceTime(300),
        switchMap(() => {
          const f = store.filters();
          patchState(store, { loading: true, error: null });
          return api
            .list({
              brand: f.brand ?? undefined,
              model: f.model ?? undefined,
              priceMax: f.priceMax ?? undefined,
              yearMin: f.yearMin ?? undefined,
              kmMax: f.kmMax ?? undefined,
              fuel: f.fuel,
              bodyType: f.bodyType,
              transmission: f.transmission,
              sort: store.sort(),
              page: store.page(),
              pageSize: store.pageSize(),
              budget: f.budget,
              down: f.down,
              term: f.term,
            })
            .pipe(
              tap((result: VehicleListResult) =>
                patchState(store, {
                  vehicles: result.data,
                  total: result.total,
                  totalPages: result.totalPages,
                  facets: result.facets,
                  loading: false,
                  initialized: true,
                }),
              ),
              catchError((e: unknown) => {
                patchState(store, {
                  loading: false,
                  initialized: true,
                  error: e instanceof Error ? e.message : 'Erro ao carregar viaturas',
                });
                return EMPTY;
              }),
            );
        }),
      ),
    );

    return {
      init(route: ActivatedRoute) {
        const p = route.snapshot.queryParams as Record<string, string>;
        const filters: ActiveFilters = {};
        if (p['brand']) filters.brand = p['brand'];
        if (p['model']) filters.model = p['model'];
        if (p['priceMax']) filters.priceMax = Number(p['priceMax']);
        if (p['yearMin']) filters.yearMin = Number(p['yearMin']);
        if (p['kmMax']) filters.kmMax = Number(p['kmMax']);
        if (p['fuel']) filters.fuel = p['fuel'];
        if (p['transmission']) filters.transmission = p['transmission'];
        if (p['bodyType']) filters.bodyType = p['bodyType'];
        if (p['budget']) filters.budget = Number(p['budget']);
        if (p['down']) filters.down = Number(p['down']);
        if (p['term']) filters.term = Number(p['term']);

        const mode: SearchMode = p['mode'] === 'budget' ? 'budget' : 'car';
        const sort: SortKey = (p['sort'] as SortKey) ?? 'NEWEST';
        const query = p['q'] ?? '';
        const parsed = query ? parse(query) : null;

        patchState(store, { mode, sort, filters, query, parsed, page: 1 });
        fetchVehicles(undefined);
      },

      setQuery(q: string, brandNames?: string[], modelEntries?: Array<{ brand: string; model: string }>) {
        const parsed = q ? parse(q, brandNames, modelEntries) : null;
        const filters: ActiveFilters = {};
        if (parsed && q) {
          if (parsed.brand) filters.brand = parsed.brand;
          if (parsed.model) filters.model = parsed.model;
          if (parsed.fuel?.length) filters.fuel = parsed.fuel[0];
          if (parsed.body?.length) filters.bodyType = parsed.body[0];
          if (parsed.priceMax) filters.priceMax = parsed.priceMax;
          if (parsed.gear) filters.transmission = parsed.gear === 'Automática' ? 'AUTOMATIC' : 'MANUAL';
          if (parsed.monthlyMax) filters.budget = parsed.monthlyMax;
        }
        patchState(store, { query: q, parsed, filters, page: 1 });
        fetchVehicles(undefined);
        syncUrl(store, router, q);
      },

      setFilter(key: keyof ActiveFilters, value: string | number | undefined) {
        patchState(store, { filters: { ...store.filters(), [key]: value }, page: 1 });
        fetchVehicles(undefined);
        syncUrl(store, router);
      },

      removeFilter(key: keyof ActiveFilters) {
        const next = { ...store.filters() };
        delete next[key];
        patchState(store, { filters: next, page: 1 });
        fetchVehicles(undefined);
        syncUrl(store, router);
      },

      clearFilters() {
        patchState(store, { filters: {}, query: '', parsed: null, page: 1 });
        fetchVehicles(undefined);
        syncUrl(store, router, '');
      },

      setSort(sort: SortKey) {
        patchState(store, { sort, page: 1 });
        fetchVehicles(undefined);
        syncUrl(store, router);
      },

      setMode(mode: SearchMode) {
        patchState(store, { mode, filters: {}, page: 1 });
        fetchVehicles(undefined);
        syncUrl(store, router);
      },

      loadMore() {
        if (store.page() < store.totalPages()) {
          patchState(store, { page: store.page() + 1 });
          fetchVehicles(undefined);
        }
      },

      refresh() {
        fetchVehicles(undefined);
      },
    };
  }),
);

function syncUrl(
  store: { filters: () => ActiveFilters; sort: () => SortKey; mode: () => SearchMode },
  router: Router,
  q?: string,
) {
  const f = store.filters();
  const params: Record<string, string> = {};
  if (q !== undefined && q !== '') params['q'] = q;
  if (store.mode() !== 'car') params['mode'] = store.mode();
  if (store.sort() !== 'NEWEST') params['sort'] = store.sort();
  for (const [k, v] of Object.entries(f)) {
    if (v !== undefined && v !== null && v !== '') params[k] = String(v);
  }
  void router.navigate([], { queryParams: params, queryParamsHandling: 'replace', replaceUrl: true });
}
