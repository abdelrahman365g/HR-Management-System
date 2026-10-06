import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/users-page/users-page/users-page').then((m) => m.UsersPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./components/users-form/users-form').then((m) => m.UsersForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/users-form/users-form').then((m) => m.UsersForm),
  },
];
