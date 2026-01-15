import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { UiNavItemComponent } from '../../shared/components/ui-nav-item/ui-nav-item.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiToastComponent } from '../../shared/components/ui-toast/ui-toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, UiNavItemComponent, UiIconComponent, UiToastComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  protected isSidebarOpen = signal(false);

  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Use the user from AuthService directly
  protected user = computed(() => this.authService.getUser()());

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  async logout() {
    await this.authService.logout();
    this.toastService.success('Logged out successfully');
  }
}
