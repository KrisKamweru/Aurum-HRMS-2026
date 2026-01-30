import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { EmployeeDashboardComponent } from './employee-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeDashboardComponent,
    AdminDashboardComponent
  ],
  template: `
    @if (canManage()) {
      <app-admin-dashboard />
    } @else {
      <app-employee-dashboard />
    }
  `
})
export class Dashboard {
  private authService = inject(AuthService);
  canManage = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);
}
