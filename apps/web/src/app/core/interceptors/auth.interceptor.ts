import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Token em memória — partilhado dentro do bundle admin
let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

const withToken = (req: Parameters<HttpInterceptorFn>[0], token: string | null) =>
  token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

/** Anexa Bearer token e faz refresh automático em 401 (rotas admin da API) */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/v1/admin') && !req.url.includes('/api/v1/auth')) {
    return next(req);
  }

  const http = inject(HttpClient);

  return next(withToken(req, accessToken)).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      if (!refreshInFlight) {
        refreshInFlight = http
          .post<{ accessToken: string }>('/api/v1/auth/refresh', {}, { withCredentials: true })
          .toPromise()
          .then((res) => {
            accessToken = res?.accessToken ?? null;
            refreshInFlight = null;
            return accessToken;
          })
          .catch(() => {
            accessToken = null;
            refreshInFlight = null;
            return null;
          });
      }
      return from(refreshInFlight).pipe(
        switchMap((token) => {
          if (!token) return throwError(() => err);
          return next(withToken(req, token));
        }),
      );
    }),
  );
};
