import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission-guard';

export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('employees', 'view')],
    loadComponent: () =>
      import('./pages/employees-page/employees-page/employees-page').then(
        (m) => m.EmployeesPage,
      ),
  },
  {
    path: 'new',
    canActivate: [permissionGuard('employees', 'edit')],
    loadComponent: () => import('./components/employee-form/employee-form').then((m) => m.EmployeeForm),
  },
  {
    path: ':id/edit',
    canActivate: [permissionGuard('employees', 'edit')],
    loadComponent: () => import('./components/employee-form/employee-form').then((m) => m.EmployeeForm),
  },
];
