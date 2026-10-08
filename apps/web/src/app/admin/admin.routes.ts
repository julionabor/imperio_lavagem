import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { roleGuard } from '../core/guards/role.guard';
import { unsavedChangesGuard } from '../core/guards/unsaved-changes.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'recuperar-password',
    loadComponent: () => import('./auth/recover.page').then((m) => m.RecoverPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'viaturas',
        loadComponent: () => import('./vehicles/vehicles-list.page').then((m) => m.VehiclesListPage),
      },
      {
        path: 'viaturas/nova',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./vehicles/vehicle-form.page').then((m) => m.VehicleFormPage),
      },
      {
        path: 'viaturas/:id',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./vehicles/vehicle-form.page').then((m) => m.VehicleFormPage),
      },
      {
        path: 'catalogos/:tipo',
        canActivate: [roleGuard(['ADMIN', 'EDITOR'])],
        loadComponent: () => import('./catalog/catalog.page').then((m) => m.CatalogPage),
      },
      {
        path: 'financiamento',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./financing/financing-list.page').then((m) => m.FinancingListPage),
      },
      {
        path: 'financiamento/:id',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./financing/financing-form.page').then((m) => m.FinancingFormPage),
      },
    ],
  },
];
