import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { UserRole } from '../../core/guards/role.guard';

export interface LoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string; role: UserRole };
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/v1/auth/login', { email, password });
  }

  me() {
    return this.http.get<MeResponse>('/api/v1/auth/me');
  }

  logout() {
    return this.http.post<void>('/api/v1/auth/logout', {}, { withCredentials: true });
  }

  forgotPassword(email: string) {
    return this.http.post<void>('/api/v1/auth/forgot', { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<void>('/api/v1/auth/reset', { token, password });
  }

  refresh() {
    return this.http.post<{ accessToken: string }>('/api/v1/auth/refresh', {}, { withCredentials: true });
  }
}
