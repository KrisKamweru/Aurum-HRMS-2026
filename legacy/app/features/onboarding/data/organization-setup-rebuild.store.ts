import { Injectable, inject, signal } from '@angular/core';
import { OnboardingRebuildDataService } from './onboarding-rebuild.data.service';
import { OrganizationSetupDraft } from './onboarding-rebuild.models';

@Injectable({ providedIn: 'root' })
export class OrganizationSetupRebuildStore {
  private readonly data = inject(OnboardingRebuildDataService);

  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async createOrganization(draft: OrganizationSetupDraft): Promise<boolean> {
    this.savingState.set(true);
    this.errorState.set(null);
    try {
      await this.data.createOrganizationWithSetup(draft);
      return true;
    } catch (error: unknown) {
      this.errorState.set(this.readError(error, 'Unable to create organization.'));
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private readError(error: unknown, fallback: string): string {
    return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
  }
}
