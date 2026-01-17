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

    // Wait for auth loading to complete (same as authGuard)
    const waitForLoading = (): Promise<void> => {
      return new Promise((resolve) => {
        const check = () => {
          if (!convexService.isLoading()()) {
            resolve();
          } else {
            setTimeout(check, 50);
          }
        };
        setTimeout(() => resolve(), 3000);
        check();
      });
    };

    await waitForLoading();

    // Wait for user data to be loaded (subscription might still be pending)
    const waitForUser = (): Promise<any> => {
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 40; // 2 seconds max (50ms * 40)
        const check = () => {
          const user = authService.getUser()();
          if (user || attempts >= maxAttempts) {
            resolve(user);
          } else {
            attempts++;
            setTimeout(check, 50);
          }
        };
        check();
      });
    };

    const user = await waitForUser();

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
