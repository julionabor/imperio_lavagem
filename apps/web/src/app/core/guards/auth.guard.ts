import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getAccessToken } from '../interceptors/auth.interceptor';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  if (getAccessToken()) return true;
  return router.createUrlTree(['/admin/login']);
};
