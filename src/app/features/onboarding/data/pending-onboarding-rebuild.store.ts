import { Injectable, inject, signal } from '@angular/core';
import { OnboardingRebuildDataService } from './onboarding-rebuild.data.service';
import { OnboardingJoinRequestRecord, OnboardingOrganizationDirectoryEntry } from './onboarding-rebuild.models';

@Injectable({ providedIn: 'root' })
export class PendingOnboardingRebuildStore {
  private readonly data = inject(OnboardingRebuildDataService);

  private readonly requestsState = signal<OnboardingJoinRequestRecord[]>([]);
  private readonly matchingOrganizationsState = signal<OnboardingOrganizationDirectoryEntry[]>([]);
  private readonly directoryOrganizationsState = signal<OnboardingOrganizationDirectoryEntry[]>([]);

  private readonly hubLoadingState = signal(false);
  private readonly directoryLoadingState = signal(false);
  private readonly joinSubmittingState = signal(false);
  private readonly cancellingRequestIdState = signal<string | null>(null);
  private readonly errorState = signal<string | null>(null);

  readonly requests = this.requestsState.asReadonly();
  readonly matchingOrganizations = this.matchingOrganizationsState.asReadonly();
  readonly directoryOrganizations = this.directoryOrganizationsState.asReadonly();
  readonly hubLoading = this.hubLoadingState.asReadonly();
  readonly directoryLoading = this.directoryLoadingState.asReadonly();
  readonly joinSubmitting = this.joinSubmittingState.asReadonly();
  readonly cancellingRequestId = this.cancellingRequestIdState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async loadHub(): Promise<void> {
    this.hubLoadingState.set(true);
    this.errorState.set(null);
    try {
      const [requests, matchingOrganizations] = await Promise.all([
        this.data.getMyJoinRequests(),
        this.data.getMatchingOrganizations()
      ]);
      this.requestsState.set(requests);
      this.matchingOrganizationsState.set(matchingOrganizations);
    } catch (error: unknown) {
      this.requestsState.set([]);
      this.matchingOrganizationsState.set([]);
      this.errorState.set(this.readError(error, 'Unable to load onboarding requests.'));
    } finally {
      this.hubLoadingState.set(false);
    }
  }

  async loadDirectory(): Promise<void> {
    this.directoryLoadingState.set(true);
    this.errorState.set(null);
    try {
      this.directoryOrganizationsState.set(await this.data.listOrganizations());
    } catch (error: unknown) {
      this.directoryOrganizationsState.set([]);
      this.errorState.set(this.readError(error, 'Unable to load organizations.'));
    } finally {
      this.directoryLoadingState.set(false);
    }
  }

  async createJoinRequest(orgId: string, note?: string): Promise<boolean> {
    this.joinSubmittingState.set(true);
    this.errorState.set(null);
    try {
      await this.data.createJoinRequest(orgId, note);
      await this.loadHub();
      return true;
    } catch (error: unknown) {
      this.errorState.set(this.readError(error, 'Unable to submit join request.'));
      return false;
    } finally {
      this.joinSubmittingState.set(false);
    }
  }

  async cancelJoinRequest(requestId: string): Promise<boolean> {
    this.cancellingRequestIdState.set(requestId);
    this.errorState.set(null);
    try {
      await this.data.cancelJoinRequest(requestId);
      await this.loadHub();
      return true;
    } catch (error: unknown) {
      this.errorState.set(this.readError(error, 'Unable to cancel join request.'));
      return false;
    } finally {
      this.cancellingRequestIdState.set(null);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private readError(error: unknown, fallback: string): string {
    return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
  }
}
