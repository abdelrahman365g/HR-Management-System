import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission-guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('settings', 'view')],
    loadComponent: () =>
      import('./pages/settings-page/settings-page/settings-page').then((m) => m.SettingsPage),
  },
];
