import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { api } from '../../../../convex/_generated/api';
import { AuthService } from '../auth/auth.service';
import { ConvexClientService } from './convex-client.service';

interface OrgMembership {
  orgId: string;
  orgName: string;
  orgStatus: 'active' | 'suspended';
  role: string;
  membershipRole: string | null;
  grantedAt: string | null;
  isLegacyPrimaryOrg: boolean;
}

interface OrgContextPayload {
  userId: string;
  activeOrgId: string | null;
  legacyOrgId: string | null;
  memberships: OrgMembership[];
  canSwitch: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OrgContextService {
  private authService = inject(AuthService);
  private convex = inject(ConvexClientService);

  private contextState = signal<OrgContextPayload | null>(null);
  private loadingState = signal(false);
  private switchingState = signal(false);
  private contextUnsubscribe: (() => void) | null = null;

  context = computed(() => this.contextState());
  loading = computed(() => this.loadingState());
  switching = computed(() => this.switchingState());
  memberships = computed(() => this.contextState()?.memberships ?? []);
  activeOrgId = computed(() => this.contextState()?.activeOrgId ?? null);
  canSwitch = computed(() => !!this.contextState()?.canSwitch);

  constructor() {
    effect(() => {
      const user = this.authService.getUser()();
      if (!user) {
        if (this.contextUnsubscribe) {
          this.contextUnsubscribe();
          this.contextUnsubscribe = null;
        }
        this.contextState.set(null);
        return;
      }

      this.loadingState.set(true);
      if (this.contextUnsubscribe) {
        this.contextUnsubscribe();
      }
      this.contextUnsubscribe = this.convex.getClient().onUpdate(api.org_context.getOrganizationContext, {}, (context) => {
        this.contextState.set((context ?? null) as OrgContextPayload | null);
        this.loadingState.set(false);
      });
    });
  }

  async switchActiveOrg(orgId: string) {
    if (!orgId) return;
    if (this.activeOrgId() === orgId) return;

    this.switchingState.set(true);
    try {
      await this.convex.getClient().mutation(api.org_context.setActiveOrganization, { orgId: orgId as any });
      await this.authService.refreshUser();
    } finally {
      this.switchingState.set(false);
    }
  }
}
