import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth-guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard-page/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
  },
];
