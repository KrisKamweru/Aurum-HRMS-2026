import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { ToastService } from '../../shared/services/toast.service';
import { api } from '../../../../convex/_generated/api';
import { Doc } from '../../../../convex/_generated/dataModel';
import { UiNavItemComponent } from '../../shared/components/ui-nav-item/ui-nav-item.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiToastComponent } from '../../shared/components/ui-toast/ui-toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, UiNavItemComponent, UiIconComponent, UiToastComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit {
  protected user = signal<Doc<'users'> | null>(null);
  protected isSidebarOpen = signal(false);

  private authService = inject(AuthService);
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.fetchUser();
  }

  async fetchUser() {
    const user = await this.convexService.getClient().query(api.users.viewer, {});
    this.user.set(user);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  async logout() {
    await this.authService.logout();
    this.toastService.success('Logged out successfully');
  }
}
