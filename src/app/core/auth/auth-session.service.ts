import { Injectable, computed, signal } from '@angular/core';
import { AppRole, SessionUser } from './auth.types';

const SESSION_STORAGE_KEY = 'aurum.rebuild.session';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly currentUser = signal<SessionUser | null>(this.readPersistedUser());

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  signInAs(role: AppRole, name = `Rebuild ${role}`): void {
    const nextUser: SessionUser = {
      id: `${Date.now()}`,
      name,
      role
    };
    this.currentUser.set(nextUser);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser));
  }

  signOut(): void {
    this.currentUser.set(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  hasAnyRole(roles: AppRole[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  private readPersistedUser(): SessionUser | null {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as SessionUser;
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      if (typeof parsed.id !== 'string' || typeof parsed.name !== 'string' || typeof parsed.role !== 'string') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
