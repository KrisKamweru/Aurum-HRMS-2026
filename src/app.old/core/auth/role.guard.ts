import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ConvexClientService } from '../services/convex-client.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return async (route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const toast = inject(ToastService);
    const convexService = inject(ConvexClientService);

    // Wait briefly for auth loading to settle, but don't hold route resolution for seconds.
    const waitForLoading = (): Promise<void> =>
      new Promise((resolve) => {
        const deadline = Date.now() + 1200;
        const check = () => {
          if (!convexService.isLoading()() || Date.now() >= deadline) {
            resolve();
            return;
          }
          setTimeout(check, 25);
        };
        check();
      });

    await waitForLoading();

    let user = authService.getUser()();
    if (!user) {
      // Best-effort refresh once so guards resolve quickly without visible route flicker.
      await authService.refreshUser();
      user = authService.getUser()();
    }

    if (!user) {
      // If no user is loaded after waiting, redirect to login
      return router.createUrlTree(['/auth/login']);
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    toast.error('You do not have permission to access this resource.');
    // Redirect to dashboard or a "not authorized" page
    return router.createUrlTree(['/dashboard']);
  };
};
