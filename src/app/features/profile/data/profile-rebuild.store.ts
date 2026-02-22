import { Injectable, inject, signal } from '@angular/core';
import { ProfileRebuildDataService } from './profile-rebuild.data.service';
import { RebuildProfileRecord, RebuildProfileUpdateInput } from './profile-rebuild.models';

@Injectable({ providedIn: 'root' })
export class ProfileRebuildStore {
  private readonly data = inject(ProfileRebuildDataService);

  private readonly profileState = signal<RebuildProfileRecord | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly profile = this.profileState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      this.profileState.set(await this.data.getMyProfile());
    } catch (error: unknown) {
      this.profileState.set(null);
      this.errorState.set(this.readError(error, 'Unable to load profile.'));
    } finally {
      this.loadingState.set(false);
    }
  }

  async save(input: RebuildProfileUpdateInput): Promise<boolean> {
    if (!this.profile()) {
      this.errorState.set('Profile is unavailable.');
      return false;
    }

    this.savingState.set(true);
    this.errorState.set(null);
    try {
      await this.data.updateMyProfile(input);
      const refreshed = await this.data.getMyProfile();
      this.profileState.set(refreshed);
      return true;
    } catch (error: unknown) {
      this.errorState.set(this.readError(error, 'Unable to update profile.'));
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
