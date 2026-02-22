import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import {
  OnboardingJoinRequestRecord,
  OnboardingJoinRequestStatus,
  OnboardingOrganizationDirectoryEntry,
  OrganizationSetupDraft,
  OrganizationSetupResult
} from './onboarding-rebuild.models';

@Injectable({ providedIn: 'root' })
export class OnboardingRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async listOrganizations(): Promise<OnboardingOrganizationDirectoryEntry[]> {
    const rows = await this.convex.query(api.onboarding.listOrganizations, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapDirectoryEntry(row))
      .filter((row): row is OnboardingOrganizationDirectoryEntry => row !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getMatchingOrganizations(): Promise<OnboardingOrganizationDirectoryEntry[]> {
    const rows = await this.convex.query(api.onboarding.getMatchingOrganizations, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapDirectoryEntry(row))
      .filter((row): row is OnboardingOrganizationDirectoryEntry => row !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getMyJoinRequests(): Promise<OnboardingJoinRequestRecord[]> {
    const rows = await this.convex.query(api.onboarding.getMyJoinRequests, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapJoinRequest(row))
      .filter((row): row is OnboardingJoinRequestRecord => row !== null)
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }

  async createJoinRequest(orgId: string, note?: string): Promise<void> {
    await this.convex.mutation(api.onboarding.createJoinRequest, {
      orgId: this.toId('organizations', orgId),
      note: this.normalizeOptional(note)
    });
  }

  async cancelJoinRequest(requestId: string): Promise<void> {
    await this.convex.mutation(api.onboarding.cancelJoinRequest, {
      requestId: this.toId('org_join_requests', requestId)
    });
  }

  async createOrganizationWithSetup(draft: OrganizationSetupDraft): Promise<OrganizationSetupResult> {
    const result = await this.convex.mutation(api.onboarding.createOrganizationWithSetup, {
      organization: {
        name: draft.organization.name.trim(),
        domain: this.normalizeOptional(draft.organization.domain)
      },
      departments: draft.departments.map((department) => ({
        name: department.name.trim(),
        code: department.code.trim(),
        description: this.normalizeOptional(department.description)
      })),
      designations: draft.designations.map((designation) => ({
        title: designation.title.trim(),
        code: designation.code.trim(),
        level: this.normalizeOptionalNumber(designation.level),
        description: this.normalizeOptional(designation.description)
      })),
      adminEmployee: {
        firstName: draft.adminEmployee.firstName.trim(),
        lastName: draft.adminEmployee.lastName.trim(),
        phone: this.normalizeOptional(draft.adminEmployee.phone),
        departmentIndex: this.normalizeOptionalIndex(draft.adminEmployee.departmentIndex),
        designationIndex: this.normalizeOptionalIndex(draft.adminEmployee.designationIndex)
      }
    });

    return {
      orgId: this.readString(result, 'orgId'),
      employeeId: this.readString(result, 'employeeId')
    };
  }

  private mapDirectoryEntry(value: unknown): OnboardingOrganizationDirectoryEntry | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const row = value as Record<string, unknown>;
    if (typeof row['_id'] !== 'string' || typeof row['name'] !== 'string') {
      return null;
    }
    return {
      id: row['_id'],
      name: row['name'],
      domain: typeof row['domain'] === 'string' && row['domain'].trim().length > 0 ? row['domain'] : undefined
    };
  }

  private mapJoinRequest(value: unknown): OnboardingJoinRequestRecord | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const row = value as Record<string, unknown>;
    if (
      typeof row['_id'] !== 'string' ||
      typeof row['orgId'] !== 'string' ||
      typeof row['orgName'] !== 'string' ||
      !this.isJoinRequestStatus(row['status']) ||
      typeof row['requestedAt'] !== 'string'
    ) {
      return null;
    }

    return {
      id: row['_id'],
      orgId: row['orgId'],
      orgName: row['orgName'],
      status: row['status'],
      requestedAt: row['requestedAt'],
      processedAt: typeof row['processedAt'] === 'string' ? row['processedAt'] : undefined,
      rejectionReason: typeof row['rejectionReason'] === 'string' ? row['rejectionReason'] : undefined
    };
  }

  private isJoinRequestStatus(value: unknown): value is OnboardingJoinRequestStatus {
    return value === 'pending' || value === 'approved' || value === 'rejected';
  }

  private normalizeOptional(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeOptionalIndex(value: number | undefined): number | undefined {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
  }

  private normalizeOptionalNumber(value: number | undefined): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private readString(value: unknown, key: string): string {
    if (!value || typeof value !== 'object') {
      return '';
    }
    const row = value as Record<string, unknown>;
    return typeof row[key] === 'string' ? row[key] : '';
  }

  private toId<T extends TableNames>(table: T, value: string): Id<T> {
    void table;
    return value as Id<T>;
  }
}
