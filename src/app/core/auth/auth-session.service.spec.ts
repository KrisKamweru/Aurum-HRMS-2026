import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ConvexClientService } from '../services/convex-client.service';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  let service: AuthSessionService;
  let isAuthenticated: ReturnType<typeof signal<boolean>>;
  let isLoading: ReturnType<typeof signal<boolean>>;
  let viewer: { _id: string; name?: string; email?: string; role?: string } | null;
  let onUpdateCallback: ((value: unknown) => void) | null;
  const unsubscribe = vi.fn();
  const signIn = vi.fn();
  const signOut = vi.fn();
  const query = vi.fn();
  const onUpdate = vi.fn();

  beforeEach(() => {
    isAuthenticated = signal(false);
    isLoading = signal(false);
    viewer = null;
    onUpdateCallback = null;
    unsubscribe.mockClear();
    signIn.mockClear();
    signOut.mockClear();
    query.mockClear();
    onUpdate.mockClear();

    signIn.mockImplementation(async () => {
      isAuthenticated.set(true);
      return { success: true };
    });
    signOut.mockResolvedValue(undefined);
    query.mockImplementation(async () => viewer);
    onUpdate.mockImplementation((_fn: unknown, _args: unknown, cb: (value: unknown) => void) => {
      onUpdateCallback = cb;
      return unsubscribe;
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ConvexClientService,
          useValue: {
            isAuthenticated: isAuthenticated.asReadonly(),
            isLoading: isLoading.asReadonly(),
            getClient: () => ({ onUpdate, query }),
            signIn,
            signOut
          }
        }
      ]
    });
    service = TestBed.inject(AuthSessionService);
  });

  it('starts unauthenticated', () => {
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('signs in with password and hydrates viewer', async () => {
    viewer = {
      _id: 'user-1',
      name: 'Admin User',
      email: 'admin@aurum.dev',
      role: 'admin'
    };

    const result = await service.loginWithPassword('admin@aurum.dev', 'secret');

    expect(result).toBe(true);
    expect(signIn).toHaveBeenCalledWith('password', {
      flow: 'signIn',
      email: 'admin@aurum.dev',
      password: 'secret'
    });
    expect(query).toHaveBeenCalled();
    expect(service.user()?.role).toBe('admin');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('waits for readiness and returns once loading settles', async () => {
    isLoading.set(true);
    const waitPromise = service.waitUntilReady(200);
    setTimeout(() => isLoading.set(false), 25);
    await waitPromise;
    expect(service.isLoading()).toBe(false);
  });

  it('signs out and clears user state', async () => {
    viewer = {
      _id: 'user-3',
      name: 'Employee User',
      email: 'employee@aurum.dev',
      role: 'employee'
    };
    await service.loginWithPassword('employee@aurum.dev', 'secret');
    await service.signOut();

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(signOut).toHaveBeenCalled();
  });
});
