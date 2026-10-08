import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { VehiclesAdminApi, type VehicleListItem, type VehicleDetail, type VehicleStatus } from './vehicles-admin.api';
import { ToastService } from '../../shared/ui/pm-toast/pm-toast';

interface VehiclesAdminState {
  items: VehicleListItem[];
  total: number;
  page: number;
  loading: boolean;
  filterStatus: string;
  filterSearch: string;
  current: VehicleDetail | null;
  currentLoading: boolean;
  saving: boolean;
  dirty: boolean;
}

export const VehiclesAdminStore = signalStore(
  withState<VehiclesAdminState>({
    items: [],
    total: 0,
    page: 1,
    loading: false,
    filterStatus: '',
    filterSearch: '',
    current: null,
    currentLoading: false,
    saving: false,
    dirty: false,
  }),

  withComputed((s) => ({
    pages: computed(() => Math.max(1, Math.ceil(s.total() / 20))),
  })),

  withMethods((store, api = inject(VehiclesAdminApi), toast = inject(ToastService)) => ({
    async loadList(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(api.list({
          page: store.page(),
          status: store.filterStatus() || undefined,
          search: store.filterSearch() || undefined,
        }));
        patchState(store, { items: res.data, total: res.meta.total, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    setPage(page: number): void {
      patchState(store, { page });
    },

    setFilterStatus(status: string): void {
      patchState(store, { filterStatus: status, page: 1 });
    },

    setFilterSearch(search: string): void {
      patchState(store, { filterSearch: search, page: 1 });
    },

    async loadVehicle(id: string): Promise<void> {
      patchState(store, { currentLoading: true, current: null });
      try {
        const vehicle = await firstValueFrom(api.get(id));
        patchState(store, { current: vehicle, currentLoading: false, dirty: false });
      } catch {
        patchState(store, { currentLoading: false });
      }
    },

    async save(data: Partial<VehicleDetail>): Promise<VehicleDetail | null> {
      patchState(store, { saving: true });
      try {
        const current = store.current();
        const result = current?.id
          ? await firstValueFrom(api.update(current.id, data))
          : await firstValueFrom(api.create(data));
        patchState(store, { current: result, saving: false, dirty: false });
        toast.success('Viatura guardada.');
        return result;
      } catch (err: unknown) {
        const msg = (err as { detail?: string })?.detail ?? 'Erro ao guardar.';
        toast.error(msg);
        patchState(store, { saving: false });
        return null;
      }
    },

    markDirty(): void {
      patchState(store, { dirty: true });
    },

    async changeStatus(id: string, status: VehicleStatus): Promise<void> {
      try {
        await firstValueFrom(api.changeStatus(id, status));
        toast.success(`Estado alterado para ${status}.`);
        // Actualiza o item na lista sem recarregar tudo
        patchState(store, {
          items: store.items().map((v) => v.id === id ? { ...v, status } : v),
        });
        if (store.current()?.id === id) {
          patchState(store, { current: { ...store.current()!, status } });
        }
      } catch (err: unknown) {
        const msg = (err as { detail?: string })?.detail ?? 'Erro ao alterar estado.';
        toast.error(msg);
      }
    },

    async duplicate(id: string): Promise<string | null> {
      try {
        const result = await firstValueFrom(api.duplicate(id));
        toast.success('Viatura duplicada.');
        return result.id;
      } catch {
        toast.error('Erro ao duplicar.');
        return null;
      }
    },

    async uploadImages(vehicleId: string, files: File[]): Promise<void> {
      try {
        const images = await firstValueFrom(api.uploadImages(vehicleId, files));
        const current = store.current();
        if (current) {
          patchState(store, { current: { ...current, images: [...current.images, ...images] } });
        }
        toast.success(`${images.length} foto(s) carregada(s).`);
      } catch (err: unknown) {
        const msg = (err as { detail?: string })?.detail ?? 'Erro ao carregar fotos.';
        toast.error(msg);
      }
    },

    async reorderImages(vehicleId: string, imageIds: string[]): Promise<void> {
      try {
        await firstValueFrom(api.reorderImages(vehicleId, imageIds));
        const current = store.current();
        if (current) {
          const sorted = imageIds.map((id, i) => {
            const img = current.images.find((x) => x.id === id)!;
            return { ...img, position: i };
          });
          patchState(store, { current: { ...current, images: sorted } });
        }
      } catch {
        toast.error('Erro ao reordenar fotos.');
      }
    },

    async setCover(vehicleId: string, imageId: string): Promise<void> {
      try {
        await firstValueFrom(api.updateImage(vehicleId, imageId, { isCover: true }));
        const current = store.current();
        if (current) {
          patchState(store, {
            current: {
              ...current,
              images: current.images.map((img) => ({ ...img, isCover: img.id === imageId })),
            },
          });
        }
        toast.success('Foto de capa definida.');
      } catch {
        toast.error('Erro ao definir capa.');
      }
    },

    async updateImageAlt(vehicleId: string, imageId: string, alt: string): Promise<void> {
      try {
        await firstValueFrom(api.updateImage(vehicleId, imageId, { alt }));
        const current = store.current();
        if (current) {
          patchState(store, {
            current: {
              ...current,
              images: current.images.map((img) => img.id === imageId ? { ...img, alt } : img),
            },
          });
        }
      } catch {
        toast.error('Erro ao guardar descrição.');
      }
    },

    async deleteImage(vehicleId: string, imageId: string): Promise<void> {
      try {
        await firstValueFrom(api.deleteImage(vehicleId, imageId));
        const current = store.current();
        if (current) {
          patchState(store, {
            current: { ...current, images: current.images.filter((img) => img.id !== imageId) },
          });
        }
        toast.success('Foto eliminada.');
      } catch {
        toast.error('Erro ao eliminar foto.');
      }
    },
  })),
);
