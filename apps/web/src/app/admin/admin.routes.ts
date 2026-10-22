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
      // Dashboard
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
      },

      // Viaturas
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

      // Destaques
      {
        path: 'destaques/:zona',
        canActivate: [roleGuard(['ADMIN', 'EDITOR'])],
        loadComponent: () => import('./featured/featured.page').then((m) => m.FeaturedPage),
      },

      // CRM
      {
        path: 'crm',
        loadComponent: () => import('./crm/pipeline.page').then((m) => m.PipelinePage),
      },
      {
        path: 'crm/contactos',
        loadComponent: () => import('./crm/contacts-list.page').then((m) => m.ContactsListPage),
      },
      {
        path: 'crm/contactos/:id',
        loadComponent: () => import('./crm/contact-detail.page').then((m) => m.ContactDetailPage),
      },
      {
        path: 'crm/tarefas',
        loadComponent: () => import('./crm/tasks.page').then((m) => m.TasksPage),
      },
      {
        path: 'crm/relatorios',
        canActivate: [roleGuard(['ADMIN', 'EDITOR'])],
        loadComponent: () => import('./crm/reports.page').then((m) => m.ReportsPage),
      },

      // Financiamento
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

      // Catálogos
      {
        path: 'catalogos/:tipo',
        canActivate: [roleGuard(['ADMIN', 'EDITOR'])],
        loadComponent: () => import('./catalog/catalog.page').then((m) => m.CatalogPage),
      },

      // Conteúdo
      {
        path: 'conteudo/:secao',
        canActivate: [roleGuard(['ADMIN', 'EDITOR'])],
        loadComponent: () => import('./content/content.page').then((m) => m.ContentPage),
      },

      // Assistente
      {
        path: 'assistente',
        canActivate: [roleGuard(['ADMIN', 'EDITOR'])],
        loadComponent: () => import('./assistant/assistant-admin.page').then((m) => m.AssistantAdminPage),
      },

      // Definições
      {
        path: 'definicoes',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage),
      },

      // Utilizadores
      {
        path: 'utilizadores',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./users/users.page').then((m) => m.UsersPage),
      },

      // Auditoria
      {
        path: 'auditoria',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./audit/audit.page').then((m) => m.AuditPage),
      },
    ],
  },
];
