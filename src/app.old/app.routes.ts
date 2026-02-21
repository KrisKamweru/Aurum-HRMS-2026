import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { Dashboard } from './features/dashboard/dashboard.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'pending',
    loadComponent: () => import('./features/pending/pending.component').then(m => m.PendingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create-organization',
    loadComponent: () => import('./features/pending/org-wizard.component').then(m => m.OrgWizardComponent),
    canActivate: [authGuard]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES)
      },
      {
        path: 'recruitment',
        loadChildren: () => import('./features/recruitment/recruitment.routes').then(m => m.RECRUITMENT_ROUTES),
        canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]
      },
      {
        path: 'training',
        loadChildren: () => import('./features/training/training.routes').then(m => m.TRAINING_ROUTES)
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/employees/employees.component').then(m => m.EmployeesComponent),
        canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('./features/employees/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent),
         canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]
      },
      {
        path: 'leave-requests',
        loadComponent: () => import('./features/leave-requests/leave-requests.component').then(m => m.LeaveRequestsComponent)
      },
      {
        path: 'attendance',
        loadChildren: () => import('./features/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
      },
      {
        path: 'core-hr',
        loadChildren: () => import('./features/core-hr/core-hr.routes').then(m => m.CORE_HR_ROUTES),
        canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
      },
      {
        path: 'organization',
        loadChildren: () => import('./features/organization/organization.routes').then(m => m.ORGANIZATION_ROUTES),
        canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
      },
      {
        path: 'payroll',
        loadChildren: () => import('./features/payroll/payroll.routes').then(m => m.PAYROLL_ROUTES)
        // Guard handled in child routes to allow employees to view slips
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES),
        canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
      },
      {
        path: 'super-admin',
        loadComponent: () => import('./features/super-admin/super-admin.component').then(m => m.SuperAdminComponent),
        canActivate: [roleGuard(['super_admin'])]
      }
    ],
  },
  {
    path: 'demo',
    loadChildren: () => import('./features/demo/demo.routes').then(m => m.DEMO_ROUTES)
  },
  {
    path: '6',
    loadComponent: () => import('./features/showcase/design-six.component').then(m => m.ShowcaseSixComponent)
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
];
// rebuild trigger
