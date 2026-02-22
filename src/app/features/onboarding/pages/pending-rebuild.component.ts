import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { OnboardingJoinRequestRecord } from '../data/onboarding-rebuild.models';
import { PendingOnboardingRebuildStore } from '../data/pending-onboarding-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pending-rebuild',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiBadgeComponent,
    UiButtonComponent,
    UiConfirmDialogComponent,
    UiIconComponent,
    UiModalComponent
  ],
  template: ''
})
export class PendingRebuildComponent implements OnInit {
  readonly store = inject(PendingOnboardingRebuildStore);
  private readonly auth = inject(AuthSessionService);

  readonly isDirectoryOpen = signal(false);
  readonly isCancelDialogOpen = signal(false);
  readonly searchTerm = signal('');
  readonly requestNote = signal('');
  readonly selectedOrganizationId = signal<string | null>(null);
  readonly pendingCancelRequest = signal<OnboardingJoinRequestRecord | null>(null);

  readonly user = this.auth.user;
  readonly userDisplayName = computed(() => this.user()?.name ?? 'Aurum User');
  readonly userEmail = computed(() => this.user()?.email ?? '');
  readonly emailDomain = computed(() => {
    const email = this.user()?.email;
    if (!email || !email.includes('@')) {
      return null;
    }
    return email.split('@')[1]?.toLowerCase() ?? null;
  });

  readonly filteredOrganizations = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (term.length === 0) {
      return this.store.directoryOrganizations();
    }
    return this.store.directoryOrganizations().filter((org) => {
      return org.name.toLowerCase().includes(term) || (org.domain?.toLowerCase().includes(term) ?? false);
    });
  });

  readonly cancelDialogOptions = computed<ConfirmDialogOptions>(() => {
    const request = this.pendingCancelRequest();
    return {
      title: 'Cancel Join Request',
      message: request ? `Cancel your request to join ${request.orgName}?` : 'Cancel this join request?',
      confirmText: 'Cancel Request',
      cancelText: 'Keep Request',
      variant: 'warning'
    };
  });

  ngOnInit(): void {
    void this.store.loadHub();
  }

  async refreshHub(): Promise<void> {
    await this.store.loadHub();
  }

  async openDirectory(preselectedOrganizationId?: string): Promise<void> {
    this.store.clearError();
    this.searchTerm.set('');
    this.requestNote.set('');
    this.selectedOrganizationId.set(preselectedOrganizationId ?? null);
    this.isDirectoryOpen.set(true);
    if (this.store.directoryOrganizations().length === 0) {
      await this.store.loadDirectory();
    }
  }

  async reloadDirectory(): Promise<void> {
    await this.store.loadDirectory();
  }

  closeDirectory(): void {
    this.isDirectoryOpen.set(false);
    this.selectedOrganizationId.set(null);
    this.requestNote.set('');
  }

  selectOrganization(id: string): void {
    this.selectedOrganizationId.set(this.selectedOrganizationId() === id ? null : id);
  }

  async submitJoinRequest(): Promise<void> {
    const selectedId = this.selectedOrganizationId();
    if (!selectedId) {
      return;
    }
    const success = await this.store.createJoinRequest(selectedId, this.requestNote());
    if (success) {
      this.closeDirectory();
    }
  }

  promptCancel(request: OnboardingJoinRequestRecord): void {
    this.pendingCancelRequest.set(request);
    this.isCancelDialogOpen.set(true);
  }

  async confirmCancel(): Promise<void> {
    const request = this.pendingCancelRequest();
    this.pendingCancelRequest.set(null);
    if (!request) {
      return;
    }
    await this.store.cancelJoinRequest(request.id);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  isRecommended(domain?: string): boolean {
    if (!domain) {
      return false;
    }
    return this.emailDomain() === domain.toLowerCase();
  }

  statusVariant(status: string): 'warning' | 'success' | 'danger' {
    if (status === 'approved') {
      return 'success';
    }
    if (status === 'rejected') {
      return 'danger';
    }
    return 'warning';
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
