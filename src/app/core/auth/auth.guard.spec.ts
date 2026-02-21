import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
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

  const run = (url: string) =>
    TestBed.runInInjectionContext(() => authGuard({} as never, { url } as never));

  it('redirects unauthenticated users to login', async () => {
    const result = await run('/dashboard');
    expect(result).toBe('/auth/login');
  });

  it('redirects pending users to pending page', async () => {
    auth.signInAs('pending');

    const result = await run('/dashboard');
    expect(result).toBe('/pending');
  });

  it('allows pending route for pending users', async () => {
    auth.signInAs('pending');

    const result = await run('/pending');
    expect(result).toBe(true);
  });

  it('redirects non-pending user away from pending page', async () => {
    auth.signInAs('employee');

    const result = await run('/pending');
    expect(result).toBe('/dashboard');
  });
});
