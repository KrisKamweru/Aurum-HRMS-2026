import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { resource } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiBadgeComponent } from '../../shared/components/ui-badge/ui-badge.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';
import { OrgBrowserDialogComponent } from './org-browser-dialog.component';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { api } from '../../../../convex/_generated/api';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiButtonComponent,
    UiBadgeComponent,
    UiIconComponent,
    UiGridComponent,
    UiGridTileComponent,
    OrgBrowserDialogComponent
  ],
  template: `
    <div class="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-2xl space-y-6">
        <!-- Header / Logo -->
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b1e3f] to-[#3f0d1c] mb-6 shadow-xl shadow-[#8b1e3f]/20">
            <span class="text-3xl font-bold text-white tracking-tighter">Ah</span>
          </div>
          <h1 class="text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">Welcome to Aurum</h1>
          <p class="mt-2 text-stone-600 dark:text-stone-400">You're almost there! Join an organization to get started.</p>
        </div>

        <!-- Main Card -->
        <div class="dash-frame">
          <ui-grid [columns]="'1fr'" [gap]="'0px'">
            <ui-grid-tile title="Organization Access" variant="compact">
              <div class="tile-body space-y-8">
                <!-- User Info -->
                <div class="flex items-center gap-4 p-4 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/8">
                  <div class="h-12 w-12 rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center text-xl text-stone-500 dark:text-stone-300 overflow-hidden">
                    @if (user()?.image) {
                      <img [src]="user()?.image" class="w-full h-full object-cover" alt="Profile">
                    } @else {
                      <ui-icon name="user" class="w-6 h-6"></ui-icon>
                    }
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-stone-900 dark:text-stone-100">{{ user()?.name }}</h3>
                    <p class="text-sm text-stone-500 dark:text-stone-400">{{ user()?.email }}</p>
                  </div>
                  <ui-button variant="ghost" size="sm" (onClick)="logout()">
                    Sign Out
                  </ui-button>
                </div>

                <!-- Join Requests -->
                <div>
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-stone-900 dark:text-stone-100">Your Requests</h3>
                    <ui-button variant="secondary" size="sm" (onClick)="showBrowser.set(true)">
                      <ui-icon name="plus" class="w-4 h-4 mr-1"></ui-icon>
                      Join Organization
                    </ui-button>
                  </div>

                  @if (requestsResource.isLoading()) {
                    <div class="space-y-3">
                      <div class="h-16 bg-stone-100 dark:bg-white/8 rounded-xl animate-pulse"></div>
                      <div class="h-16 bg-stone-100 dark:bg-white/8 rounded-xl animate-pulse"></div>
                    </div>
                  } @else if (requestsResource.error()) {
                    <div class="p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                      Failed to load requests
                    </div>
                  } @else {
                    @let requests = requestsResource.value();

                    @if (!requests || requests.length === 0) {
                      <div class="text-center py-8 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-xl bg-stone-50/50 dark:bg-white/[0.03]">
                        <ui-icon name="building-office-2" class="w-8 h-8 mx-auto text-stone-400 mb-2"></ui-icon>
                        <p class="text-stone-500 dark:text-stone-400 font-medium">No active requests</p>
                        <p class="text-sm text-stone-400 dark:text-stone-500">Search for your organization to request access</p>
                      </div>
                    } @else {
                      <div class="space-y-3">
                        @for (req of requests; track req._id) {
                          <div class="p-4 rounded-xl border border-stone-200 dark:border-white/8 bg-white dark:bg-white/5 flex items-center justify-between group hover:border-[#8b1e3f]/20 dark:hover:border-[#8b1e3f]/40 transition-all">
                            <div>
                              <h4 class="font-semibold text-stone-900 dark:text-stone-100">{{ req.orgName }}</h4>
                              <div class="flex items-center gap-2 mt-1">
                                <ui-badge [variant]="getStatusVariant(req.status)" size="sm">
                                  {{ req.status | titlecase }}
                                </ui-badge>
                                <span class="text-xs text-stone-400 dark:text-stone-500">
                                  Requested {{ req.requestedAt | date:'mediumDate' }}
                                </span>
                              </div>
                            </div>

                            @if (req.status === 'pending') {
                              <ui-button
                                variant="ghost"
                                size="sm"
                                class="text-red-600 hover:text-red-700 hover:bg-red-50"
                                [loading]="cancellingId() === req._id"
                                (onClick)="cancelRequest(req._id)"
                              >
                                Cancel
                              </ui-button>
                            }
                          </div>
                        }
                      </div>
                    }
                  }
                </div>

                <!-- Matching Orgs (Suggestions) -->
                @if (matchingOrgsResource.value()?.length) {
                  <div class="pt-6 border-t border-stone-100 dark:border-white/8">
                    <h3 class="font-semibold text-stone-900 dark:text-stone-100 mb-4">Suggested for You</h3>
                    <div class="grid gap-3">
                      @for (org of matchingOrgsResource.value(); track org._id) {
                        <div class="p-4 rounded-xl bg-gradient-to-r from-[#fdf2f4] to-white dark:from-[#3f1320]/60 dark:to-[#1e1c1d] border border-[#fce7eb] dark:border-[#8b1e3f]/35 flex items-center justify-between">
                          <div>
                            <h4 class="font-semibold text-stone-900 dark:text-stone-100">{{ org.name }}</h4>
                            <p class="text-xs text-[#8b1e3f]">Matches your email domain</p>
                          </div>
                          <ui-button variant="primary" size="sm" (onClick)="openBrowserWithOrg(org)">
                            Join
                          </ui-button>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Create New Organization -->
                <div class="pt-6 border-t border-stone-100 dark:border-white/8">
                  <div class="text-center">
                    <p class="text-sm text-stone-500 dark:text-stone-400 mb-3">Or, if you're setting up a new company:</p>
                    <a
                      routerLink="/create-organization"
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-[#8b1e3f]/30 dark:border-[#8b1e3f]/50 text-[#8b1e3f] dark:text-[#d95a79] hover:bg-[#fdf2f4] dark:hover:bg-[#3f1320]/40 hover:border-[#8b1e3f]/50 transition-all font-medium text-sm"
                    >
                      <ui-icon name="building-office-2" class="w-5 h-5"></ui-icon>
                      Create New Organization
                    </a>
                  </div>
                </div>
              </div>
            </ui-grid-tile>
          </ui-grid>
        </div>
      </div>
    </div>

    <!-- Org Browser Dialog -->
    <app-org-browser-dialog
      [(isOpen)]="showBrowser"
      (requestSent)="onRequestSent()"
    />
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PendingComponent {
  private authService = inject(AuthService);
  private convex = inject(ConvexClientService);
  private confirmDialog = inject(ConfirmDialogService);

  user = this.authService.getUser();
  showBrowser = signal(false);
  cancellingId = signal<string | null>(null);
  refreshTrigger = signal(0);

  // Resources
  requestsResource = resource({
    loader: async () => {
      // Access trigger to create dependency
      this.refreshTrigger();
      return this.convex.getClient().query(api.onboarding.getMyJoinRequests, {});
    }
  });

  matchingOrgsResource = resource({
    loader: () => this.convex.getClient().query(api.onboarding.getMatchingOrganizations, {})
  });

  getStatusVariant(status: string): 'warning' | 'success' | 'danger' {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  }

  async logout() {
    await this.authService.logout();
  }

  async cancelRequest(id: string) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Cancel Join Request',
      message: 'Are you sure you want to cancel this request? You can submit a new request anytime.',
      confirmText: 'Cancel Request',
      cancelText: 'Go Back',
      variant: 'warning'
    });

    if (!confirmed) return;

    this.cancellingId.set(id);
    try {
      await this.convex.getClient().mutation(api.onboarding.cancelJoinRequest, {
        requestId: id as any
      });
      this.refreshTrigger.update(v => v + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel request');
    } finally {
      this.cancellingId.set(null);
    }
  }

  onRequestSent() {
    this.refreshTrigger.update(v => v + 1);
  }

  openBrowserWithOrg(org: any) {
    this.showBrowser.set(true);
    // Ideally we'd pass the pre-selected org to the dialog,
    // but for now just opening it is fine
  }
}
