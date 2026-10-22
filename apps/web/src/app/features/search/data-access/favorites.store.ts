import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';

const STORAGE_KEY = 'pm_favorites';

function loadFromStorage(): Set<string> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function saveToStorage(ids: Set<string>): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    }
  } catch {
    // ignore
  }
}

interface FavoritesState {
  ids: string[];
}

export const FavoritesStore = signalStore(
  { providedIn: 'root' },
  withState<FavoritesState>({ ids: [] }),
  withComputed((store) => ({
    count: () => store.ids().length,
    idSet: () => new Set(store.ids()),
  })),
  withMethods((store) => ({
    init() {
      patchState(store, { ids: [...loadFromStorage()] });
    },
    toggle(id: string) {
      const set = new Set(store.ids());
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      saveToStorage(set);
      patchState(store, { ids: [...set] });
    },
    isFavorite(id: string) {
      return store.ids().includes(id);
    },
  })),
);
