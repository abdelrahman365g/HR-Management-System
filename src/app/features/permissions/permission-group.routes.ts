import { Routes } from '@angular/router';

export const PERMISSION_GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/groups-list/groups-list/groups-list').then(
        (m) => m.PermissionGroupsList,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/permissions_form/permission-group-form/permission-group-form').then(
        (m) => m.PermissionGroupForm,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/permissions_form/permission-group-form/permission-group-form').then(
        (m) => m.PermissionGroupForm,
      ),
  },
];