import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';
import { SessionUser } from './auth.types';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let user: ReturnType<typeof signal<SessionUser | null>>;
  let authLoading: ReturnType<typeof signal<boolean>>;
  const waitUntilReady = vi.fn();
  const createUrlTree = vi.fn((commands: string[]) => commands[0]);

  beforeEach(() => {
    user = signal<SessionUser | null>(null);
    authLoading = signal(false);
    createUrlTree.mockClear();
    waitUntilReady.mockClear();
    waitUntilReady.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthSessionService,
          useValue: {
            user: user.asReadonly(),
            isLoading: authLoading.asReadonly(),
            waitUntilReady
          }
        },
        {
          provide: Router,
          useValue: {
            createUrlTree
          }
        }
      ]
    });
  });

  const run = (url: string) =>
    TestBed.runInInjectionContext(() => authGuard({} as never, { url } as never));

  it('redirects unauthenticated users to login', async () => {
    const result = await run('/dashboard');
    expect(result).toBe('/auth/login');
  });

  it('redirects pending users to pending page', async () => {
    user.set({ id: 'user-p', name: 'Pending User', role: 'pending' });

    const result = await run('/dashboard');
    expect(result).toBe('/pending');
  });

  it('allows pending route for pending users', async () => {
    user.set({ id: 'user-p', name: 'Pending User', role: 'pending' });

    const result = await run('/pending');
    expect(result).toBe(true);
  });

  it('redirects non-pending user away from pending page', async () => {
    user.set({ id: 'user-e', name: 'Employee User', role: 'employee' });

    const result = await run('/pending');
    expect(result).toBe('/dashboard');
  });
});
