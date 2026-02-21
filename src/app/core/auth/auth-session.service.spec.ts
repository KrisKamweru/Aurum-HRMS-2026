import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  let service: AuthSessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthSessionService);
  });

  it('starts unauthenticated', () => {
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('signs in a role and persists session', () => {
    service.signInAs('admin');

    expect(service.user()?.role).toBe('admin');
    expect(service.isAuthenticated()).toBe(true);
    expect(sessionStorage.getItem('aurum.rebuild.session')).toContain('"role":"admin"');
  });

  it('signs out and clears session', () => {
    service.signInAs('employee');
    service.signOut();

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('aurum.rebuild.session')).toBeNull();
  });
});
