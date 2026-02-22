import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import {
  OrganizationDraft,
  OrganizationStatus,
  SuperAdminOrganization,
  SuperAdminStats,
  UpdateOrganizationDraft
} from './super-admin-rebuild.models';

@Injectable({ providedIn: 'root' })
export class SuperAdminRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async listOrganizations(): Promise<SuperAdminOrganization[]> {
    const rows = await this.convex.query(api.super_admin.listOrganizations, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapOrganization(row))
      .filter((row): row is SuperAdminOrganization => row !== null);
  }

  async getSystemStats(): Promise<SuperAdminStats> {
    const result = await this.convex.query(api.super_admin.getSystemStats, {});
    return this.mapStats(result);
  }

  async createOrganization(payload: OrganizationDraft): Promise<string> {
    const result = await this.convex.mutation(api.super_admin.createOrganization, {
      name: payload.name,
      domain: this.normalizeOptionalText(payload.domain),
      subscriptionPlan: payload.subscriptionPlan
    });
    return typeof result === 'string' ? result : '';
  }

  async updateOrganization(payload: UpdateOrganizationDraft): Promise<void> {
    await this.convex.mutation(api.super_admin.updateOrganization, {
      orgId: this.toId('organizations', payload.id),
      name: payload.name,
      domain: this.normalizeOptionalText(payload.domain),
      subscriptionPlan: payload.subscriptionPlan
    });
  }

  async updateOrganizationStatus(id: string, status: OrganizationStatus): Promise<void> {
    await this.convex.mutation(api.super_admin.updateOrganizationStatus, {
      orgId: this.toId('organizations', id),
      status
    });
  }

  private mapOrganization(row: unknown): SuperAdminOrganization | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['name'] !== 'string' ||
      !this.isPlan(value['subscriptionPlan']) ||
      !this.isStatus(value['status'])
    ) {
      return null;
    }
    return {
      id: value['_id'],
      name: value['name'],
      domain: typeof value['domain'] === 'string' ? value['domain'] : undefined,
      subscriptionPlan: value['subscriptionPlan'],
      status: value['status'],
      userCount: this.readNumber(value['userCount']),
      employeeCount: this.readNumber(value['employeeCount']),
      pendingRequestCount: this.readNumber(value['pendingRequestCount'])
    };
  }

  private mapStats(row: unknown): SuperAdminStats {
    if (!row || typeof row !== 'object') {
      return {
        totalOrganizations: 0,
        activeOrganizations: 0,
        suspendedOrganizations: 0,
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        totalEmployees: 0
      };
    }
    const value = row as Record<string, unknown>;
    return {
      totalOrganizations: this.readNumber(value['totalOrganizations']),
      activeOrganizations: this.readNumber(value['activeOrganizations']),
      suspendedOrganizations: this.readNumber(value['suspendedOrganizations']),
      totalUsers: this.readNumber(value['totalUsers']),
      activeUsers: this.readNumber(value['activeUsers']),
      pendingUsers: this.readNumber(value['pendingUsers']),
      totalEmployees: this.readNumber(value['totalEmployees'])
    };
  }

  private isPlan(value: unknown): value is OrganizationDraft['subscriptionPlan'] {
    return value === 'free' || value === 'pro' || value === 'enterprise';
  }

  private isStatus(value: unknown): value is OrganizationStatus {
    return value === 'active' || value === 'suspended';
  }

  private readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private toId<T extends TableNames>(table: T, id: string): Id<T> {
    void table;
    return id as Id<T>;
  }
}
