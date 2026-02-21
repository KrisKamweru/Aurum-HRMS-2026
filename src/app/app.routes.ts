import { Route, Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

const placeholderLoader = () =>
  import('./features/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent);

const placeholderRoute = (path: string, title: string, canActivate: Route['canActivate'] = []): Route => ({
  path,
  loadComponent: placeholderLoader,
  data: { title },
  canActivate
});

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/rebuild-home/rebuild-home.component').then((m) => m.RebuildHomeComponent),
    canActivate: [authGuard]
  },
  placeholderRoute('pending', 'Pending Onboarding', [authGuard]),
  placeholderRoute('create-organization', 'Organization Setup Wizard', [authGuard]),
  placeholderRoute('profile', 'Profile', [authGuard]),
  placeholderRoute('settings', 'Settings', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('settings/general', 'General Settings', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('settings/leave-policies', 'Leave Policies', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('recruitment', 'Recruitment', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('recruitment/jobs', 'Recruitment Jobs', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('recruitment/jobs/new', 'Create Job', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('recruitment/jobs/:id', 'Job Detail', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('recruitment/jobs/:id/edit', 'Edit Job', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('recruitment/board', 'Candidate Board', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('training', 'Training', [authGuard]),
  placeholderRoute('training/catalog', 'Training Catalog', [authGuard]),
  placeholderRoute('training/my-learning', 'My Learning', [authGuard]),
  placeholderRoute('training/courses/new', 'Create Course', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('training/courses/:id/edit', 'Edit Course', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('employees', 'Employees', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('employees/:id', 'Employee Detail', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('leave-requests', 'Leave Requests', [authGuard]),
  placeholderRoute('attendance', 'Attendance', [authGuard]),
  placeholderRoute('attendance/team', 'Team Attendance', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]),
  placeholderRoute('core-hr', 'Core HR', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('core-hr/promotions', 'Promotions', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('core-hr/transfers', 'Transfers', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('core-hr/awards', 'Awards', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('core-hr/warnings', 'Warnings', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('core-hr/resignations', 'Resignations', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('core-hr/terminations', 'Terminations', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('core-hr/complaints', 'Complaints', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('core-hr/travel', 'Travel', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('organization', 'Organization', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  {
    path: 'organization/departments',
    loadComponent: () =>
      import('./features/organization/pages/departments-rebuild.component').then((m) => m.DepartmentsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Departments' }
  },
  {
    path: 'organization/designations',
    loadComponent: () =>
      import('./features/organization/pages/designations-rebuild.component').then((m) => m.DesignationsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Designations' }
  },
  {
    path: 'organization/locations',
    loadComponent: () =>
      import('./features/organization/pages/locations-rebuild.component').then((m) => m.LocationsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Locations' }
  },
  {
    path: 'organization/user-linking',
    loadComponent: () =>
      import('./features/organization/pages/user-linking-rebuild.component').then((m) => m.UserLinkingRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'User Linking' }
  },
  placeholderRoute('organization/chart', 'Organization Chart', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('organization/settings', 'Organization Settings', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('payroll', 'Payroll', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('payroll/:id', 'Payroll Run', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('payroll/slip/:id', 'Payslip View', [authGuard]),
  placeholderRoute('reports', 'Reports', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('reports/attendance', 'Attendance Report', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('reports/analytics', 'Analytics Report', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('reports/payroll', 'Payroll Report', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('reports/tax', 'Tax Report', [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])]),
  placeholderRoute('super-admin', 'Super Admin', [authGuard, roleGuard(['super_admin'])]),
  placeholderRoute('demo', 'Demo'),
  placeholderRoute('demo/buttons', 'Demo Buttons'),
  placeholderRoute('demo/forms', 'Demo Forms'),
  placeholderRoute('demo/tables', 'Demo Tables'),
  placeholderRoute('demo/modals', 'Demo Modals'),
  placeholderRoute('demo/date-picker', 'Demo Date Picker'),
  placeholderRoute('6', 'Showcase Six'),
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  placeholderRoute('auth', 'Authentication'),
  placeholderRoute('auth/register', 'Register'),
  placeholderRoute('auth/forgot-password', 'Forgot Password'),
  { path: '**', redirectTo: 'dashboard' }
];
