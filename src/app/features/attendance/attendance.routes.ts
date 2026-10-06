import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission-guard';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('attendance', 'view')],
    loadComponent: () =>
      import('./pages/attendance-page/attendance-page').then(
        (m) => m.AttendancePage,
      ),
  },
  {
    path: 'clock',
    canActivate: [permissionGuard('attendance', 'view')],
    loadComponent: () =>
      import('./pages/attendance-clock-page/attendance-clock-page/attendance-clock-page').then(
        (m) => m.AttendanceClockPage,
      ),
  },
  {
    path: 'new',
    canActivate: [permissionGuard('attendance', 'edit')],
    loadComponent: () =>
      import('./components/attendance-form/attendance-form').then((m) => m.AttendanceForm),
  },
  {
    path: ':id/edit',
    canActivate: [permissionGuard('attendance', 'edit')],
    loadComponent: () =>
      import('./components/attendance-form/attendance-form').then((m) => m.AttendanceForm),
  },
  {
    path: 'import',
    canActivate: [permissionGuard('attendance', 'edit')],
    loadComponent: () =>
      import('./components/attendance-import/attendance-import').then((m) => m.AttendanceImport),
  },
];