import { Component, signal, inject, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { UiNavItemComponent } from '../../shared/components/ui-nav-item/ui-nav-item.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiToastComponent } from '../../shared/components/ui-toast/ui-toast.component';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationsPanelComponent } from '../../shared/components/notifications-panel/notifications-panel.component';
import { OrgContextService } from '../../core/services/org-context.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    UiNavItemComponent,
    UiIconComponent,
    UiToastComponent,
    RouterLink,
    NotificationsPanelComponent
  ],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  protected isSidebarOpen = signal(false);

  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  protected themeService = inject(ThemeService);
  protected notificationService = inject(NotificationService);
  protected orgContextService = inject(OrgContextService);

  // Use the user from AuthService directly
  protected user = computed(() => this.authService.getUser()());
  protected orgContext = computed(() => this.orgContextService.context());
  protected memberships = computed(() => this.orgContextService.memberships());
  protected activeOrgId = computed(() => this.orgContextService.activeOrgId());
  protected activeOrgName = computed(() => {
    const active = this.activeOrgId();
    const membership = this.memberships().find((org) => org.orgId === active);
    return membership?.orgName ?? 'Unassigned';
  });
  protected canSwitchOrg = computed(() => this.orgContextService.canSwitch());
  protected isSwitchingOrg = computed(() => this.orgContextService.switching());

  // Role-based permissions
  protected canManageEmployees = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);
  protected canManageOrganization = this.authService.hasRole(['super_admin', 'admin', 'hr_manager']);
  protected canViewPayroll = this.authService.hasRole(['super_admin', 'admin', 'hr_manager']);
  protected isSuperAdmin = this.authService.hasRole(['super_admin']);

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  async logout() {
    await this.authService.logout();
    this.toastService.success('Logged out successfully');
  }

  async switchOrganization(orgId: string) {
    if (!orgId) return;
    try {
      await this.orgContextService.switchActiveOrg(orgId);
      this.toastService.success('Organization switched');
      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.toastService.error(error?.message || 'Failed to switch organization');
    }
  }
}
