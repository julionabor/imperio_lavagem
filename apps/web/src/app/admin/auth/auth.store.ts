import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi, type MeResponse } from './auth.api';
import { setAccessToken } from '../../core/interceptors/auth.interceptor';
import { setCurrentRole, type UserRole } from '../../core/guards/role.guard';
import { ToastService } from '../../shared/ui/pm-toast/pm-toast';

interface AuthState {
  user: MeResponse | null;
  loading: boolean;
  error: string | null;
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>({ user: null, loading: false, error: null }),

  withComputed((state) => ({
    isAuthenticated: computed(() => !!state.user()),
    role: computed(() => state.user()?.role ?? null),
    userName: computed(() => state.user()?.name ?? ''),
  })),

  withMethods((store, api = inject(AuthApi), router = inject(Router), toast = inject(ToastService)) => ({
    async login(email: string, password: string): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        const res = await firstValueFrom(api.login(email, password));
        setAccessToken(res.accessToken);
        setCurrentRole(res.user.role as UserRole);
        patchState(store, { user: res.user, loading: false });
        return true;
      } catch (err: unknown) {
        const msg = (err as { detail?: string })?.detail ?? 'Credenciais inválidas.';
        patchState(store, { loading: false, error: msg });
        return false;
      }
    },

    async logout(): Promise<void> {
      try { await firstValueFrom(api.logout()); } catch {}
      setAccessToken(null);
      setCurrentRole(null);
      patchState(store, { user: null, error: null });
      router.navigate(['/admin/login']);
    },

    async loadMe(): Promise<void> {
      try {
        const user = await firstValueFrom(api.me());
        setCurrentRole(user.role as UserRole);
        patchState(store, { user });
      } catch {
        setAccessToken(null);
        setCurrentRole(null);
        patchState(store, { user: null });
      }
    },

    async forgotPassword(email: string): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        await firstValueFrom(api.forgotPassword(email));
        patchState(store, { loading: false });
        toast.success('Email enviado. Verifique a sua caixa de entrada.');
      } catch {
        patchState(store, { loading: false, error: 'Erro ao enviar email.' });
      }
    },

    async resetPassword(token: string, password: string): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        await firstValueFrom(api.resetPassword(token, password));
        patchState(store, { loading: false });
        toast.success('Password alterada com sucesso.');
        return true;
      } catch (err: unknown) {
        const msg = (err as { detail?: string })?.detail ?? 'Erro ao alterar password.';
        patchState(store, { loading: false, error: msg });
        return false;
      }
    },
  })),
);
