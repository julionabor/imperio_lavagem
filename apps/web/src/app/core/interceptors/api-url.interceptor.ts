import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Prefixa pedidos relativos com a URL da API */
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  if (req.url.startsWith('/api/')) {
    const base = isBrowser ? '' : 'http://localhost:3000';
    return next(req.clone({ url: `${base}${req.url}` }));
  }
  return next(req);
};
