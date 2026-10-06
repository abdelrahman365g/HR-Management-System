import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission-guard';

export const OFFICIAL_HOLIDAYS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('official_holidays', 'view')],
    loadComponent: () =>
      import(
        './pages/official-holidays-page/official-holidays-page/official-holidays-page'
      ).then((m) => m.OfficialHolidaysPage),
  },
];
