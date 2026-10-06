import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { PermissionAction, ScreenKey } from '../interfaces/permission.interface';

export function permissionGuard(screen: ScreenKey, action: PermissionAction): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await auth.whenReady;

    if (auth.hasPermission(screen, action)) return true;

    return router.createUrlTree(['/']);
  };
}