import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let auth: AuthSessionService;
  const createUrlTree = vi.fn((commands: string[]) => commands[0]);

  beforeEach(() => {
    sessionStorage.clear();
    createUrlTree.mockClear();

    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        {
          provide: Router,
          useValue: {
            createUrlTree
          }
        }
      ]
    });

    auth = TestBed.inject(AuthSessionService);
  });

  const run = (allowed: Array<'super_admin' | 'admin' | 'hr_manager' | 'manager' | 'employee' | 'pending'>) =>
    TestBed.runInInjectionContext(() => roleGuard(allowed)({} as never, {} as never));

  it('redirects unauthenticated users to login', async () => {
    const result = await run(['admin']);
    expect(result).toBe('/auth/login');
  });

  it('allows matching roles', async () => {
    auth.signInAs('manager');
    const result = await run(['manager', 'admin']);
    expect(result).toBe(true);
  });

  it('redirects non-authorized roles to dashboard', async () => {
    auth.signInAs('employee');
    const result = await run(['admin', 'hr_manager']);
    expect(result).toBe('/dashboard');
  });
});
