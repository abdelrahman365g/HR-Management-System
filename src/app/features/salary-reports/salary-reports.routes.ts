import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission-guard';

export const SALARY_REPORTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('salary_reports', 'view')],
    loadComponent: () =>
      import(
        './pages/salary-reports-page/salary-reports-page/salary-reports-page'
      ).then((m) => m.SalaryReportsPage),
  },
];
