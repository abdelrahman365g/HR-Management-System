import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { permissionGuard } from './core/guards/permission-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./core/layouts/auth-layout/auth-layout/auth-layout').then((m) => m.AuthLayout),
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layouts/main-layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        // authGuard already applies via the parent; the dashboard itself
        // needs no screen permission.
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'permission-groups',
        canActivate: [permissionGuard('permission_groups', 'view')],
        loadChildren: () =>
          import('./features/permissions/permission-group.routes').then(
            (m) => m.PERMISSION_GROUPS_ROUTES,
          ),
      },
      {
        path: 'users',
        canActivate: [permissionGuard('users', 'view')],
        loadChildren: () =>
          import('./features/user-management/users.routes').then((m) => m.USERS_ROUTES),
      },
      {
        // authGuard already protects everything under main-layout; the
        // view/edit splits live in the lazy route files.
        path: 'employees',
        loadChildren: () =>
          import('./features/employees/employees.routes').then((m) => m.EMPLOYEES_ROUTES),
      },
      {
        path: 'departments',
        loadChildren: () =>
          import('./features/departments/departments.routes').then((m) => m.DEPARTMENTS_ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        path: 'official-holidays',
        loadChildren: () =>
          import('./features/official-holidays/official-holidays.routes').then(
            (m) => m.OFFICIAL_HOLIDAYS_ROUTES,
          ),
      },
      {
        path: 'attendance',
        loadChildren: () =>
          import('./features/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES),
      },
      {
        path: 'salary-reports',
        loadChildren: () =>
          import('./features/salary-reports/salary-reports.routes').then(
            (m) => m.SALARY_REPORTS_ROUTES,
          ),
      },
      {
        path: 'not-found',
        loadComponent: () =>
          import('./features/static-pages/not-found-page/not-found-page/not-found-page').then(
            (m) => m.NotFoundPage,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
