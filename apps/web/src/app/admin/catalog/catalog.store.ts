import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { CatalogApi, type Brand, type Model, type EquipmentItem, type SearchSynonym, type FinancingProductSummary } from './catalog.api';
import { ToastService } from '../../shared/ui/pm-toast/pm-toast';

interface CatalogState {
  brands: Brand[];
  models: Model[];
  equipmentItems: EquipmentItem[];
  synonyms: SearchSynonym[];
  financingProducts: FinancingProductSummary[];
  loading: boolean;
  saving: boolean;
}

export const CatalogStore = signalStore(
  withState<CatalogState>({
    brands: [],
    models: [],
    equipmentItems: [],
    synonyms: [],
    financingProducts: [],
    loading: false,
    saving: false,
  }),
  withMethods((store, api = inject(CatalogApi), toast = inject(ToastService)) => ({
    async loadAll(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const [brands, models, equipment, financing] = await Promise.all([
          firstValueFrom(api.getBrands()),
          firstValueFrom(api.getModels()),
          firstValueFrom(api.getEquipment()),
          firstValueFrom(api.getFinancingProducts()),
        ]);
        patchState(store, {
          brands: brands.data,
          models: models.data,
          equipmentItems: equipment.data,
          financingProducts: financing.data,
          loading: false,
        });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async loadSynonyms(): Promise<void> {
      const res = await firstValueFrom(api.getSynonyms());
      patchState(store, { synonyms: res.data });
    },

    async saveBrand(data: Partial<Brand>, id?: string): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        const result = id
          ? await firstValueFrom(api.updateBrand(id, data))
          : await firstValueFrom(api.createBrand(data));
        patchState(store, {
          brands: id
            ? store.brands().map((b) => b.id === id ? result : b)
            : [...store.brands(), result],
          saving: false,
        });
        toast.success('Marca guardada.');
        return true;
      } catch (err: unknown) {
        toast.error((err as { detail?: string })?.detail ?? 'Erro ao guardar.');
        patchState(store, { saving: false });
        return false;
      }
    },

    async deleteBrand(id: string): Promise<void> {
      try {
        await firstValueFrom(api.deleteBrand(id));
        patchState(store, { brands: store.brands().filter((b) => b.id !== id) });
        toast.success('Marca eliminada.');
      } catch (err: unknown) {
        toast.error((err as { detail?: string })?.detail ?? 'Não é possível eliminar.');
      }
    },

    async saveModel(data: Partial<Model>, id?: string): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        const result = id
          ? await firstValueFrom(api.updateModel(id, data))
          : await firstValueFrom(api.createModel(data));
        patchState(store, {
          models: id
            ? store.models().map((m) => m.id === id ? result : m)
            : [...store.models(), result],
          saving: false,
        });
        toast.success('Modelo guardado.');
        return true;
      } catch (err: unknown) {
        toast.error((err as { detail?: string })?.detail ?? 'Erro ao guardar.');
        patchState(store, { saving: false });
        return false;
      }
    },

    async deleteModel(id: string): Promise<void> {
      try {
        await firstValueFrom(api.deleteModel(id));
        patchState(store, { models: store.models().filter((m) => m.id !== id) });
        toast.success('Modelo eliminado.');
      } catch (err: unknown) {
        toast.error((err as { detail?: string })?.detail ?? 'Não é possível eliminar.');
      }
    },

    async saveEquipment(data: Partial<EquipmentItem>, id?: string): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        const result = id
          ? await firstValueFrom(api.updateEquipment(id, data))
          : await firstValueFrom(api.createEquipment(data));
        patchState(store, {
          equipmentItems: id
            ? store.equipmentItems().map((e) => e.id === id ? result : e)
            : [...store.equipmentItems(), result],
          saving: false,
        });
        toast.success('Item guardado.');
        return true;
      } catch (err: unknown) {
        toast.error((err as { detail?: string })?.detail ?? 'Erro ao guardar.');
        patchState(store, { saving: false });
        return false;
      }
    },

    async deleteEquipment(id: string): Promise<void> {
      try {
        await firstValueFrom(api.deleteEquipment(id));
        patchState(store, { equipmentItems: store.equipmentItems().filter((e) => e.id !== id) });
        toast.success('Item eliminado.');
      } catch (err: unknown) {
        toast.error((err as { detail?: string })?.detail ?? 'Não é possível eliminar.');
      }
    },

    async saveSynonym(data: Partial<SearchSynonym>, id?: string): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        const result = id
          ? await firstValueFrom(api.updateSynonym(id, data))
          : await firstValueFrom(api.createSynonym(data));
        patchState(store, {
          synonyms: id
            ? store.synonyms().map((s) => s.id === id ? result : s)
            : [...store.synonyms(), result],
          saving: false,
        });
        toast.success('Sinónimo guardado.');
        return true;
      } catch (err: unknown) {
        toast.error((err as { detail?: string })?.detail ?? 'Erro ao guardar.');
        patchState(store, { saving: false });
        return false;
      }
    },

    async deleteSynonym(id: string): Promise<void> {
      try {
        await firstValueFrom(api.deleteSynonym(id));
        patchState(store, { synonyms: store.synonyms().filter((s) => s.id !== id) });
        toast.success('Sinónimo eliminado.');
      } catch (err: unknown) {
        toast.error((err as { detail?: string })?.detail ?? 'Não é possível eliminar.');
      }
    },

    async parseTest(query: string): Promise<unknown[]> {
      try {
        const res = await firstValueFrom(api.parseTest(query));
        return res.chips;
      } catch {
        return [];
      }
    },
  })),
);
