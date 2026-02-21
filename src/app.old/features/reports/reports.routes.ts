import { Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { roleGuard } from '../../core/auth/role.guard';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    component: ReportsComponent,
    canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
  },
  {
    path: 'attendance',
    loadComponent: () => import('./pages/attendance-report.component').then(m => m.AttendanceReportComponent),
    canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./pages/analytics-report.component').then(m => m.AnalyticsReportComponent),
    canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
  },
  {
    path: 'payroll',
    loadComponent: () => import('./pages/payroll-report.component').then(m => m.PayrollReportComponent),
    canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
  },
  {
    path: 'tax',
    loadComponent: () => import('./pages/tax-report.component').then(m => m.TaxReportComponent),
    canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
  }
];
