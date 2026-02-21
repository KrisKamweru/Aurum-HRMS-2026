import { computed, effect, Injectable, signal } from '@angular/core';
import { api } from '../../../../convex/_generated/api';
import { ConvexClientService } from '../services/convex-client.service';
import { AppRole, SessionUser } from './auth.types';

type ViewerRecord = {
  _id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly currentUser = signal<SessionUser | null>(null);
  private readonly loadingState = signal(true);

  readonly user = this.currentUser.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor(private readonly convex: ConvexClientService) {
    effect((onCleanup) => {
      const clientLoading = this.convex.isLoading();
      const authenticated = this.convex.isAuthenticated();

      if (clientLoading) {
        this.loadingState.set(true);
        return;
      }

      if (!authenticated) {
        this.currentUser.set(null);
        this.loadingState.set(false);
        return;
      }

      this.loadingState.set(true);
      const unsubscribe = this.convex.getClient().onUpdate(api.users.viewer, {}, (viewer) => {
        this.currentUser.set(this.mapViewer(viewer));
        this.loadingState.set(false);
      });

      onCleanup(() => {
        unsubscribe();
      });
    });
  }

  async loginWithPassword(email: string, password: string): Promise<boolean> {
    const result = await this.convex.signIn('password', {
      flow: 'signIn',
      email,
      password
    });
    if (!result.success) {
      return false;
    }
    await this.refreshUser();
    return this.currentUser() !== null;
  }

  async registerWithPassword(name: string, email: string, password: string): Promise<boolean> {
    const result = await this.convex.signIn('password', {
      flow: 'signUp',
      name,
      email,
      password
    });
    if (!result.success) {
      return false;
    }
    await this.refreshUser();
    return this.currentUser() !== null;
  }

  async signOut(): Promise<void> {
    await this.convex.signOut();
    this.currentUser.set(null);
  }

  hasAnyRole(roles: AppRole[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  async refreshUser(): Promise<void> {
    if (!this.convex.isAuthenticated()) {
      this.currentUser.set(null);
      this.loadingState.set(false);
      return;
    }
    this.loadingState.set(true);
    try {
      const viewer = await this.convex.getClient().query(api.users.viewer, {});
      this.currentUser.set(this.mapViewer(viewer));
    } finally {
      this.loadingState.set(false);
    }
  }

  async waitUntilReady(timeoutMs = 1500): Promise<void> {
    const startedAt = Date.now();
    while (this.isLoading() && Date.now() - startedAt < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  private mapViewer(viewer: unknown): SessionUser | null {
    if (!viewer || typeof viewer !== 'object') {
      return null;
    }

    const record = viewer as Partial<ViewerRecord>;
    if (typeof record._id !== 'string') {
      return null;
    }

    const role = this.normalizeRole(record.role);
    const name = typeof record.name === 'string' && record.name.trim().length > 0 ? record.name : 'Aurum User';
    const email = typeof record.email === 'string' ? record.email : undefined;

    return {
      id: record._id,
      name,
      role,
      email
    };
  }

  private normalizeRole(role: unknown): AppRole {
    switch (role) {
      case 'super_admin':
      case 'admin':
      case 'hr_manager':
      case 'manager':
      case 'employee':
      case 'pending':
        return role;
      default:
        return 'pending';
    }
  }
}
