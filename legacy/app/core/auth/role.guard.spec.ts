import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';
import { SessionUser } from './auth.types';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
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

  const run = (allowed: Array<'super_admin' | 'admin' | 'hr_manager' | 'manager' | 'employee' | 'pending'>) =>
    TestBed.runInInjectionContext(() => roleGuard(allowed)({} as never, {} as never));

  it('redirects unauthenticated users to login', async () => {
    const result = await run(['admin']);
    expect(result).toBe('/auth/login');
  });

  it('allows matching roles', async () => {
    user.set({ id: 'user-m', name: 'Manager User', role: 'manager' });
    const result = await run(['manager', 'admin']);
    expect(result).toBe(true);
  });

  it('redirects non-authorized roles to dashboard', async () => {
    user.set({ id: 'user-e', name: 'Employee User', role: 'employee' });
    const result = await run(['admin', 'hr_manager']);
    expect(result).toBe('/dashboard');
  });
});
