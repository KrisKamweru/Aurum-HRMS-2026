import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';
import { AppRole } from './auth.types';

export const roleGuard = (allowedRoles: AppRole[]): CanActivateFn => {
  return async () => {
    const auth = inject(AuthSessionService);
    const router = inject(Router);
    await auth.waitUntilReady();
    const user = auth.user();

    if (!user) {
      return router.createUrlTree(['/auth/login']);
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };
};
