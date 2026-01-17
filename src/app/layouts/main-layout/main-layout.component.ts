import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { UiNavItemComponent } from '../../shared/components/ui-nav-item/ui-nav-item.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiToastComponent } from '../../shared/components/ui-toast/ui-toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, UiNavItemComponent, UiIconComponent, UiToastComponent, RouterLink],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  protected isSidebarOpen = signal(false);

  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  protected themeService = inject(ThemeService);

  // Use the user from AuthService directly
  protected user = computed(() => this.authService.getUser()());

  // Role-based permissions
  protected canManageEmployees = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);
  protected canManageOrganization = this.authService.hasRole(['super_admin', 'admin', 'hr_manager']);
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
}
