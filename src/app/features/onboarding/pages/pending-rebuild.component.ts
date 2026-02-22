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
  template: `
    <main class="h-full overflow-y-auto bg-[radial-gradient(circle_at_12%_10%,_rgba(127,29,29,0.12),_transparent_45%),radial-gradient(circle_at_85%_15%,_rgba(180,83,9,0.10),_transparent_40%),linear-gradient(180deg,_#f8f6f2_0%,_#f3efe8_100%)] px-4 py-8 dark:bg-stone-950 sm:px-6">
      <div class="mx-auto w-full max-w-6xl space-y-6">
        <section class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Onboarding</p>
              <h1 class="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Pending Access</h1>
              <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
                Join an existing organization or create a new workspace to finish setup.
              </p>
              <div class="flex flex-wrap gap-2">
                <ui-badge size="sm" [rounded]="true" variant="neutral">{{ userDisplayName() }}</ui-badge>
                @if (userEmail()) {
                  <ui-badge size="sm" [rounded]="true" variant="primary">{{ userEmail() }}</ui-badge>
                }
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <ui-button size="sm" variant="secondary" [disabled]="store.hubLoading()" (onClick)="refreshHub()">Refresh</ui-button>
              <ui-button size="sm" variant="ghost" (onClick)="signOut()">Sign Out</ui-button>
            </div>
          </div>
        </section>

        @if (store.error()) {
          <section class="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {{ store.error() }}
          </section>
        }

        <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article class="min-w-0 rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Join Requests</h2>
                <p class="text-sm text-stone-600 dark:text-stone-400">Track submitted requests and cancel pending ones.</p>
              </div>
              <ui-button size="sm" variant="primary" [disabled]="store.joinSubmitting()" (onClick)="openDirectory()">
                <ui-icon name="plus" class="h-4 w-4"></ui-icon>
                Join Organization
              </ui-button>
            </div>

            @if (store.hubLoading()) {
              <div class="space-y-3">
                <div class="h-16 animate-pulse rounded-xl bg-stone-200/70 dark:bg-white/10"></div>
                <div class="h-16 animate-pulse rounded-xl bg-stone-200/70 dark:bg-white/10"></div>
              </div>
            } @else if (store.requests().length === 0) {
              <div class="rounded-2xl border border-dashed border-stone-300 bg-white/40 p-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
                <ui-icon name="building-office-2" class="mx-auto h-8 w-8 text-stone-400 dark:text-stone-500"></ui-icon>
                <p class="mt-2 font-medium text-stone-800 dark:text-stone-100">No join requests yet</p>
                <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">Open the directory and send a request to an org admin.</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (request of store.requests(); track request.id) {
                  <div class="rounded-2xl border border-stone-200/80 bg-white/60 p-4 dark:border-white/8 dark:bg-white/[0.02]">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div class="space-y-2">
                        <p class="font-semibold text-stone-900 dark:text-stone-100">{{ request.orgName }}</p>
                        <div class="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                          <ui-badge size="sm" [rounded]="true" [variant]="statusVariant(request.status)">
                            {{ statusLabel(request.status) }}
                          </ui-badge>
                          <span>{{ request.requestedAt | date:'mediumDate' }}</span>
                        </div>
                        @if (request.rejectionReason) {
                          <p class="text-xs text-amber-700 dark:text-amber-300">{{ request.rejectionReason }}</p>
                        }
                      </div>
                      @if (request.status === 'pending') {
                        <ui-button
                          size="sm"
                          variant="outline"
                          [loading]="store.cancellingRequestId() === request.id"
                          (onClick)="promptCancel(request)"
                        >
                          Cancel
                        </ui-button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </article>

          <aside class="space-y-4">
            <article class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
              <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Suggested</h2>
              <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">Based on your email domain.</p>
              @if (store.matchingOrganizations().length === 0) {
                <p class="mt-4 text-sm text-stone-500 dark:text-stone-400">No matches yet.</p>
              } @else {
                <div class="mt-4 space-y-3">
                  @for (org of store.matchingOrganizations(); track org.id) {
                    <div class="rounded-2xl border border-burgundy-200/60 bg-burgundy-50/60 p-4 dark:border-burgundy-500/20 dark:bg-burgundy-700/10">
                      <p class="font-semibold text-stone-900 dark:text-stone-100">{{ org.name }}</p>
                      <p class="text-xs text-burgundy-700 dark:text-burgundy-300">{{ org.domain || 'No domain listed' }}</p>
                      <ui-button class="mt-3" size="sm" variant="primary" (onClick)="openDirectory(org.id)">Request Access</ui-button>
                    </div>
                  }
                </div>
              }
            </article>

            <article class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
              <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">New Organization</h2>
              <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Create a new workspace and become the initial admin for it.
              </p>
              <a
                routerLink="/create-organization"
                class="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-burgundy-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-burgundy-600"
              >
                <ui-icon name="building-office-2" class="h-4 w-4"></ui-icon>
                Create Organization
              </a>
            </article>
          </aside>
        </section>
      </div>

      <ui-modal [isOpen]="isDirectoryOpen()" (isOpenChange)="isDirectoryOpen.set($event)" [hasFooter]="false" width="wide" title="Join an Organization">
        <div class="space-y-4">
          <div class="grid gap-3 md:grid-cols-2">
            <label class="space-y-1">
              <span class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Search</span>
              <input
                type="text"
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event)"
                placeholder="Search by name or domain"
                class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100"
              />
            </label>
            <label class="space-y-1">
              <span class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Note (Optional)</span>
              <textarea
                rows="2"
                [ngModel]="requestNote()"
                (ngModelChange)="requestNote.set($event)"
                class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100"
              ></textarea>
            </label>
          </div>

          <div class="max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-stone-200 bg-white/40 p-3 dark:border-white/8 dark:bg-white/[0.02]">
            @if (store.directoryLoading()) {
              <div class="space-y-3">
                <div class="h-14 animate-pulse rounded-xl bg-stone-200/70 dark:bg-white/10"></div>
                <div class="h-14 animate-pulse rounded-xl bg-stone-200/70 dark:bg-white/10"></div>
              </div>
            } @else if (filteredOrganizations().length === 0) {
              <p class="rounded-xl border border-dashed border-stone-300 p-5 text-center text-sm text-stone-500 dark:border-white/10 dark:text-stone-400">
                No organizations match your search.
              </p>
            } @else {
              @for (org of filteredOrganizations(); track org.id) {
                <button
                  type="button"
                  class="w-full rounded-xl border p-3 text-left transition-colors"
                  [class]="selectedOrganizationId() === org.id ? 'border-burgundy-300 bg-burgundy-50/70 dark:border-burgundy-500/30 dark:bg-burgundy-700/10' : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-white/8 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]'"
                  (click)="selectOrganization(org.id)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-semibold text-stone-900 dark:text-stone-100">{{ org.name }}</p>
                      <p class="text-xs text-stone-500 dark:text-stone-400">{{ org.domain || 'No domain listed' }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      @if (isRecommended(org.domain)) {
                        <ui-badge size="sm" [rounded]="true" variant="success">Recommended</ui-badge>
                      }
                      @if (selectedOrganizationId() === org.id) {
                        <ui-badge size="sm" [rounded]="true" variant="primary">Selected</ui-badge>
                      }
                    </div>
                  </div>
                </button>
              }
            }
          </div>

          <div class="flex items-center justify-between gap-3 border-t border-stone-200 pt-4 dark:border-white/8">
            <ui-button size="sm" variant="secondary" [disabled]="store.directoryLoading()" (onClick)="reloadDirectory()">Reload</ui-button>
            <div class="flex gap-2">
              <ui-button size="sm" variant="ghost" [disabled]="store.joinSubmitting()" (onClick)="closeDirectory()">Close</ui-button>
              <ui-button size="sm" variant="primary" [disabled]="!selectedOrganizationId()" [loading]="store.joinSubmitting()" (onClick)="submitJoinRequest()">
                Send Request
              </ui-button>
            </div>
          </div>
        </div>
      </ui-modal>

      <ui-confirm-dialog
        [isOpen]="isCancelDialogOpen()"
        (isOpenChange)="isCancelDialogOpen.set($event)"
        [options]="cancelDialogOptions()"
        (confirm)="confirmCancel()"
      />
    </main>
  `
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
