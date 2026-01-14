import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { api } from '../../../../convex/_generated/api';
import { Doc } from '../../../../convex/_generated/dataModel';
import { UiNavItemComponent } from '../../shared/components/ui-nav-item/ui-nav-item.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, UiNavItemComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent implements OnInit {
  protected user = signal<Doc<'users'> | null>(null);
  protected isSidebarOpen = signal(false);

  constructor(
    private authService: AuthService,
    private convexService: ConvexClientService
  ) {}

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

  logout() {
    this.authService.logout();
  }
}
