import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/search/pages/search.page').then((m) => m.SearchPage),
  },
  {
    path: 'viaturas/:slug',
    loadComponent: () =>
      import('./features/vehicle/vehicle-detail.page').then((m) => m.VehicleDetailPage),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
