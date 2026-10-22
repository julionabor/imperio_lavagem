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
    path: 'privacidade',
    loadComponent: () =>
      import('./features/legal/legal.page').then((m) => m.LegalPage),
    data: { slug: 'privacidade' },
  },
  {
    path: 'cookies',
    loadComponent: () =>
      import('./features/legal/legal.page').then((m) => m.LegalPage),
    data: { slug: 'cookies' },
  },
  {
    path: 'termos',
    loadComponent: () =>
      import('./features/legal/legal.page').then((m) => m.LegalPage),
    data: { slug: 'termos' },
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
