import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export type UserRole = 'ADMIN' | 'EDITOR' | 'SALES';

// Referência ao perfil do utilizador autenticado
let currentRole: UserRole | null = null;

export function setCurrentRole(role: UserRole | null): void {
  currentRole = role;
}

export function roleGuard(allowed: UserRole[]): CanActivateFn {
  return () => {
    const router = inject(Router);
    if (currentRole && allowed.includes(currentRole)) return true;
    return router.createUrlTree(['/admin']);
  };
}
