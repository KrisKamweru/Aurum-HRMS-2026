import { Injectable, computed, inject, signal } from '@angular/core';
import {
  OrganizationDraft,
  OrganizationStatus,
  SuperAdminOrganization,
  SuperAdminStats,
  UpdateOrganizationDraft
} from './super-admin-rebuild.models';
import { SuperAdminRebuildDataService } from './super-admin-rebuild.data.service';

const emptyStats: SuperAdminStats = {
  totalOrganizations: 0,
  activeOrganizations: 0,
  suspendedOrganizations: 0,
  totalUsers: 0,
  activeUsers: 0,
  pendingUsers: 0,
  totalEmployees: 0
};

@Injectable({ providedIn: 'root' })
export class SuperAdminRebuildStore {
  private readonly data = inject(SuperAdminRebuildDataService);

  private readonly organizationState = signal<SuperAdminOrganization[]>([]);
  private readonly statsState = signal<SuperAdminStats>(emptyStats);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly organizations = this.organizationState.asReadonly();
  readonly stats = this.statsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly activeOrganizations = computed(() => this.organizations().filter((org) => org.status === 'active').length);
  readonly suspendedOrganizations = computed(() => this.organizations().filter((org) => org.status === 'suspended').length);

  async loadDashboard(): Promise<void> {
    this.loadingState.set(true);
    this.clearError();
    try {
      const [organizations, stats] = await Promise.all([this.data.listOrganizations(), this.data.getSystemStats()]);
      this.organizationState.set(organizations);
      this.statsState.set(stats);
    } catch (error: unknown) {
      this.setError(error, 'Unable to load super-admin dashboard.');
    } finally {
      this.loadingState.set(false);
    }
  }

  async createOrganization(payload: OrganizationDraft): Promise<boolean> {
    const draft = this.normalizeDraft(payload);
    if (!draft) {
      return false;
    }
    if (this.hasDuplicateName(draft.name)) {
      this.errorState.set('Organization name already exists.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.createOrganization(draft);
      await this.loadDashboard();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to create organization.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateOrganization(payload: UpdateOrganizationDraft): Promise<boolean> {
    const id = payload.id.trim();
    if (!id) {
      this.errorState.set('Organization id is required.');
      return false;
    }

    const draft = this.normalizeDraft(payload);
    if (!draft) {
      return false;
    }
    if (this.hasDuplicateName(draft.name, id)) {
      this.errorState.set('Organization name already exists.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.updateOrganization({ id, ...draft });
      await this.loadDashboard();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update organization.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async setOrganizationStatus(id: string, status: OrganizationStatus): Promise<boolean> {
    const orgId = id.trim();
    if (!orgId) {
      this.errorState.set('Organization id is required.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.updateOrganizationStatus(orgId, status);
      this.organizationState.update((rows) => rows.map((row) => (row.id === orgId ? { ...row, status } : row)));
      this.statsState.update((stats) => this.syncStats(stats, status, orgId));
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update organization status.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private normalizeDraft(payload: OrganizationDraft): OrganizationDraft | null {
    const name = payload.name.trim();
    const domain = payload.domain?.trim();
    if (!name) {
      this.errorState.set('Organization name is required.');
      return null;
    }
    if (domain && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
      this.errorState.set('Domain must be a valid host name.');
      return null;
    }
    return {
      name,
      domain: domain && domain.length > 0 ? domain : undefined,
      subscriptionPlan: payload.subscriptionPlan
    };
  }

  private hasDuplicateName(name: string, currentId?: string): boolean {
    const target = name.trim().toLowerCase();
    return this.organizations().some((org) => org.id !== currentId && org.name.trim().toLowerCase() === target);
  }

  private syncStats(stats: SuperAdminStats, nextStatus: OrganizationStatus, orgId: string): SuperAdminStats {
    const current = this.organizations().find((org) => org.id === orgId);
    if (!current || current.status === nextStatus) {
      return stats;
    }
    if (nextStatus === 'active') {
      return {
        ...stats,
        activeOrganizations: stats.activeOrganizations + 1,
        suspendedOrganizations: Math.max(0, stats.suspendedOrganizations - 1)
      };
    }
    return {
      ...stats,
      activeOrganizations: Math.max(0, stats.activeOrganizations - 1),
      suspendedOrganizations: stats.suspendedOrganizations + 1
    };
  }

  private setError(error: unknown, fallback: string): void {
    if (error instanceof Error && error.message.trim().length > 0) {
      this.errorState.set(error.message);
      return;
    }
    this.errorState.set(fallback);
  }
}
