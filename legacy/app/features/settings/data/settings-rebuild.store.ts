import { Injectable, inject, signal } from '@angular/core';
import {
  RebuildGeneralSettings,
  RebuildLeavePolicy,
  RebuildLeavePolicyCreateInput,
  RebuildLeavePolicyUpdateInput
} from './settings-rebuild.models';
import { SettingsRebuildDataService } from './settings-rebuild.data.service';

const defaultSettings: RebuildGeneralSettings = {
  currency: 'USD',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  workDays: [1, 2, 3, 4, 5]
};

@Injectable({ providedIn: 'root' })
export class SettingsRebuildStore {
  private readonly data = inject(SettingsRebuildDataService);

  private readonly generalSettingsState = signal<RebuildGeneralSettings>(defaultSettings);
  private readonly leavePoliciesState = signal<RebuildLeavePolicy[]>([]);

  private readonly generalLoadingState = signal(false);
  private readonly policiesLoadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly seedingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly generalSettings = this.generalSettingsState.asReadonly();
  readonly leavePolicies = this.leavePoliciesState.asReadonly();
  readonly generalLoading = this.generalLoadingState.asReadonly();
  readonly policiesLoading = this.policiesLoadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly isSeeding = this.seedingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async loadGeneralSettings(): Promise<void> {
    this.generalLoadingState.set(true);
    this.errorState.set(null);
    try {
      this.generalSettingsState.set(await this.data.getGeneralSettings());
    } catch (error: unknown) {
      this.errorState.set(this.readError(error, 'Unable to load general settings.'));
    } finally {
      this.generalLoadingState.set(false);
    }
  }

  async saveGeneralSettings(input: RebuildGeneralSettings): Promise<boolean> {
    this.savingState.set(true);
    this.errorState.set(null);
    try {
      await this.data.updateGeneralSettings(input);
      this.generalSettingsState.set({ ...input, workDays: [...input.workDays] });
      return true;
    } catch (error: unknown) {
      this.errorState.set(this.readError(error, 'Unable to save general settings.'));
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async loadLeavePolicies(): Promise<void> {
    this.policiesLoadingState.set(true);
    this.errorState.set(null);
    try {
      this.leavePoliciesState.set(await this.data.listLeavePolicies());
    } catch (error: unknown) {
      this.leavePoliciesState.set([]);
      this.errorState.set(this.readError(error, 'Unable to load leave policies.'));
    } finally {
      this.policiesLoadingState.set(false);
    }
  }

  async createLeavePolicy(input: RebuildLeavePolicyCreateInput): Promise<boolean> {
    const payload = this.normalizeCreateInput(input);
    if (!payload) {
      return false;
    }
    if (this.leavePolicies().some((policy) => policy.code.toLowerCase() === payload.code.toLowerCase())) {
      this.errorState.set('Leave policy code must be unique.');
      return false;
    }

    this.savingState.set(true);
    this.errorState.set(null);
    try {
      await this.data.createLeavePolicy(payload);
      await this.loadLeavePolicies();
      return true;
    } catch (error: unknown) {
      this.errorState.set(this.readError(error, 'Unable to create leave policy.'));
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateLeavePolicy(input: RebuildLeavePolicyUpdateInput): Promise<boolean> {
    if (!this.leavePolicies().some((policy) => policy.id === input.id)) {
      this.errorState.set('Leave policy not found.');
      return false;
    }
    this.savingState.set(true);
    this.errorState.set(null);
    try {
      await this.data.updateLeavePolicy(input);
      await this.loadLeavePolicies();
      return true;
    } catch (error: unknown) {
      this.errorState.set(this.readError(error, 'Unable to update leave policy.'));
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async deleteLeavePolicy(id: string): Promise<boolean> {
    if (!this.leavePolicies().some((policy) => policy.id === id)) {
      this.errorState.set('Leave policy not found.');
      return false;
    }
    this.savingState.set(true);
    this.errorState.set(null);
    try {
      await this.data.deleteLeavePolicy(id);
      await this.loadLeavePolicies();
      return true;
    } catch (error: unknown) {
      this.errorState.set(this.readError(error, 'Unable to delete leave policy.'));
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async seedDefaults(): Promise<boolean> {
    this.seedingState.set(true);
    this.errorState.set(null);
    try {
      await this.data.seedDefaultPolicies();
      await this.loadLeavePolicies();
      return true;
    } catch (error: unknown) {
      this.errorState.set(this.readError(error, 'Unable to seed default leave policies.'));
      return false;
    } finally {
      this.seedingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private normalizeCreateInput(input: RebuildLeavePolicyCreateInput): RebuildLeavePolicyCreateInput | null {
    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();
    if (!name || !code) {
      this.errorState.set('Policy name and code are required.');
      return null;
    }
    if (!Number.isFinite(input.daysPerYear) || input.daysPerYear <= 0) {
      this.errorState.set('Days per year must be greater than zero.');
      return null;
    }
    return {
      ...input,
      name,
      code,
      daysPerYear: Number(input.daysPerYear),
      carryOverDays:
        typeof input.carryOverDays === 'number' && Number.isFinite(input.carryOverDays) ? input.carryOverDays : undefined,
      description: input.description?.trim() ? input.description.trim() : undefined
    };
  }

  private readError(error: unknown, fallback: string): string {
    return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
  }
}
