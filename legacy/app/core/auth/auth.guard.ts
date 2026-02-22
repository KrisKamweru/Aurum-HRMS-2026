import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);
  await auth.waitUntilReady();
  const user = auth.user();

  if (!user) {
    return router.createUrlTree(['/auth/login']);
  }

  if (user.role === 'pending') {
    const allowedPendingUrls = ['/pending', '/create-organization'];
    if (!allowedPendingUrls.includes(state.url)) {
      return router.createUrlTree(['/pending']);
    }
    return true;
  }

  if (state.url === '/pending') {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
