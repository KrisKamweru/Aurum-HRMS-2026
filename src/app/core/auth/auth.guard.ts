import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Wait for initial auth check to complete
  if (authService.isAuthLoading()()) {
    // This is a bit of a hack for signals in guards, ideally we'd use an effect or observable
    // But since checkAuthStatus is async, we can await it if we expose a promise or similar
    // For now, we'll just check the current value which is set in the constructor
    await authService.checkAuthStatus();
  }

  const isLoggedIn = authService.isLoggedIn()();

  if (isLoggedIn) {
    return true;
  }

  // Redirect to login page with return url
  return router.createUrlTree(['/auth/login']);
};
