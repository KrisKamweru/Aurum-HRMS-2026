import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import {
  RebuildAccrualFrequency,
  RebuildDateFormat,
  RebuildGeneralSettings,
  RebuildLeavePolicy,
  RebuildLeavePolicyCreateInput,
  RebuildLeavePolicyType,
  RebuildLeavePolicyUpdateInput
} from './settings-rebuild.models';

@Injectable({ providedIn: 'root' })
export class SettingsRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async getGeneralSettings(): Promise<RebuildGeneralSettings> {
    const result = await this.convex.query(api.settings.getSettings, {});
    return this.mapGeneralSettings(result);
  }

  async updateGeneralSettings(input: RebuildGeneralSettings): Promise<void> {
    await this.convex.mutation(api.settings.updateSettings, {
      currency: input.currency,
      timezone: input.timezone,
      dateFormat: input.dateFormat,
      workDays: [...input.workDays]
    });
  }

  async listLeavePolicies(): Promise<RebuildLeavePolicy[]> {
    const rows = await this.convex.query(api.settings.listLeavePolicies, {});
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => this.mapLeavePolicy(row))
      .filter((row): row is RebuildLeavePolicy => row !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createLeavePolicy(input: RebuildLeavePolicyCreateInput): Promise<void> {
    await this.convex.mutation(api.settings.createLeavePolicy, {
      name: input.name,
      code: input.code,
      type: input.type,
      daysPerYear: input.daysPerYear,
      accrualFrequency: input.accrualFrequency,
      carryOverDays: input.carryOverDays,
      description: this.normalizeOptional(input.description)
    });
  }

  async updateLeavePolicy(input: RebuildLeavePolicyUpdateInput): Promise<void> {
    await this.convex.mutation(api.settings.updateLeavePolicy, {
      id: this.toId('leave_policies', input.id),
      updates: {
        name: this.normalizeOptional(input.name),
        daysPerYear: this.normalizeOptionalNumber(input.daysPerYear),
        accrualFrequency: input.accrualFrequency,
        carryOverDays: this.normalizeOptionalNumber(input.carryOverDays),
        description: this.normalizeOptional(input.description),
        isActive: input.isActive
      }
    });
  }

  async deleteLeavePolicy(id: string): Promise<void> {
    await this.convex.mutation(api.settings.deleteLeavePolicy, {
      id: this.toId('leave_policies', id)
    });
  }

  async seedDefaultPolicies(): Promise<void> {
    await this.convex.mutation(api.settings.seedDefaultPolicies, {});
  }

  private mapGeneralSettings(value: unknown): RebuildGeneralSettings {
    if (!value || typeof value !== 'object') {
      return {
        currency: 'USD',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        workDays: [1, 2, 3, 4, 5]
      };
    }
    const row = value as Record<string, unknown>;
    return {
      currency: typeof row['currency'] === 'string' ? row['currency'] : 'USD',
      timezone: typeof row['timezone'] === 'string' ? row['timezone'] : 'UTC',
      dateFormat: this.readDateFormat(row['dateFormat']),
      workDays: Array.isArray(row['workDays'])
        ? row['workDays'].filter((day): day is number => typeof day === 'number')
        : [1, 2, 3, 4, 5]
    };
  }

  private mapLeavePolicy(value: unknown): RebuildLeavePolicy | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const row = value as Record<string, unknown>;
    if (
      typeof row['_id'] !== 'string' ||
      typeof row['name'] !== 'string' ||
      typeof row['code'] !== 'string' ||
      !this.isPolicyType(row['type'])
    ) {
      return null;
    }

    return {
      id: row['_id'],
      name: row['name'],
      code: row['code'],
      type: row['type'],
      daysPerYear: this.readNumber(row['daysPerYear']),
      accrualFrequency: this.isAccrualFrequency(row['accrualFrequency']) ? row['accrualFrequency'] : 'annual',
      carryOverDays:
        typeof row['carryOverDays'] === 'number' && Number.isFinite(row['carryOverDays']) ? row['carryOverDays'] : undefined,
      description: typeof row['description'] === 'string' ? row['description'] : undefined,
      isActive: row['isActive'] !== false
    };
  }

  private readDateFormat(value: unknown): RebuildDateFormat {
    if (value === 'MM/DD/YYYY' || value === 'DD/MM/YYYY' || value === 'YYYY-MM-DD') {
      return value;
    }
    return 'MM/DD/YYYY';
  }

  private isPolicyType(value: unknown): value is RebuildLeavePolicyType {
    return (
      value === 'vacation' ||
      value === 'sick' ||
      value === 'personal' ||
      value === 'maternity' ||
      value === 'paternity' ||
      value === 'other'
    );
  }

  private isAccrualFrequency(value: unknown): value is RebuildAccrualFrequency {
    return value === 'annual' || value === 'monthly';
  }

  private readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private normalizeOptional(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeOptionalNumber(value: number | undefined): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private toId<T extends TableNames>(table: T, value: string): Id<T> {
    void table;
    return value as Id<T>;
  }
}
