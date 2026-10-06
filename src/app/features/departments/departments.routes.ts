import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission-guard';

export const DEPARTMENTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('employees', 'view')],
    loadComponent: () =>
      import('./pages/departments-page/departments-page/departments-page').then(
        (m) => m.DepartmentsPage,
      ),
  },
];
