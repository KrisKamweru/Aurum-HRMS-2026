import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ConvexClientService } from '../services/convex-client.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const convexService = inject(ConvexClientService);

  // Wait for initial auth check to complete
  const waitForLoading = (): Promise<void> => {
    return new Promise((resolve) => {
      const check = () => {
        if (!convexService.isLoading()()) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      // Set a max timeout
      setTimeout(() => resolve(), 3000);
      check();
    });
  };

  await waitForLoading();

  const isLoggedIn = authService.isLoggedIn()();

  if (isLoggedIn) {
    return true;
  }

  // Redirect to login page
  return router.createUrlTree(['/auth/login']);
};
