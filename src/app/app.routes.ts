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
  {
    path: 'recruitment',
    loadComponent: () =>
      import('./features/recruitment/pages/recruitment-jobs-rebuild.component').then(
        (m) => m.RecruitmentJobsRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Recruitment' }
  },
  {
    path: 'recruitment/jobs',
    loadComponent: () =>
      import('./features/recruitment/pages/recruitment-jobs-rebuild.component').then(
        (m) => m.RecruitmentJobsRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Recruitment Jobs' }
  },
  {
    path: 'recruitment/jobs/new',
    loadComponent: () =>
      import('./features/recruitment/pages/recruitment-job-editor-rebuild.component').then(
        (m) => m.RecruitmentJobEditorRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Create Job' }
  },
  {
    path: 'recruitment/jobs/:id',
    loadComponent: () =>
      import('./features/recruitment/pages/recruitment-job-detail-rebuild.component').then(
        (m) => m.RecruitmentJobDetailRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Job Detail' }
  },
  {
    path: 'recruitment/jobs/:id/edit',
    loadComponent: () =>
      import('./features/recruitment/pages/recruitment-job-editor-rebuild.component').then(
        (m) => m.RecruitmentJobEditorRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Edit Job' }
  },
  {
    path: 'recruitment/board',
    loadComponent: () =>
      import('./features/recruitment/pages/recruitment-board-rebuild.component').then(
        (m) => m.RecruitmentBoardRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Candidate Board' }
  },
  {
    path: 'training',
    loadComponent: () =>
      import('./features/training/pages/training-catalog-rebuild.component').then((m) => m.TrainingCatalogRebuildComponent),
    canActivate: [authGuard],
    data: { title: 'Training' }
  },
  {
    path: 'training/catalog',
    loadComponent: () =>
      import('./features/training/pages/training-catalog-rebuild.component').then((m) => m.TrainingCatalogRebuildComponent),
    canActivate: [authGuard],
    data: { title: 'Training Catalog' }
  },
  {
    path: 'training/my-learning',
    loadComponent: () =>
      import('./features/training/pages/training-my-learning-rebuild.component').then(
        (m) => m.TrainingMyLearningRebuildComponent
      ),
    canActivate: [authGuard],
    data: { title: 'My Learning' }
  },
  {
    path: 'training/courses/new',
    loadComponent: () =>
      import('./features/training/pages/training-course-editor-rebuild.component').then(
        (m) => m.TrainingCourseEditorRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Create Course' }
  },
  {
    path: 'training/courses/:id/edit',
    loadComponent: () =>
      import('./features/training/pages/training-course-editor-rebuild.component').then(
        (m) => m.TrainingCourseEditorRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Edit Course' }
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./features/employees/pages/employees-rebuild.component').then((m) => m.EmployeesRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Employees' }
  },
  {
    path: 'employees/:id',
    loadComponent: () =>
      import('./features/employees/pages/employee-detail-rebuild.component').then(
        (m) => m.EmployeeDetailRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Employee Detail' }
  },
  {
    path: 'leave-requests',
    loadComponent: () =>
      import('./features/leave/pages/leave-requests-rebuild.component').then((m) => m.LeaveRequestsRebuildComponent),
    canActivate: [authGuard],
    data: { title: 'Leave Requests' }
  },
  {
    path: 'attendance',
    loadComponent: () =>
      import('./features/attendance/pages/attendance-rebuild.component').then((m) => m.AttendanceRebuildComponent),
    canActivate: [authGuard],
    data: { title: 'Attendance' }
  },
  {
    path: 'attendance/team',
    loadComponent: () =>
      import('./features/attendance/pages/team-attendance-rebuild.component').then(
        (m) => m.TeamAttendanceRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])],
    data: { title: 'Team Attendance' }
  },
  {
    path: 'core-hr',
    loadComponent: () => import('./features/core-hr/pages/core-hr-rebuild.component').then((m) => m.CoreHrRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Core HR' }
  },
  {
    path: 'core-hr/promotions',
    loadComponent: () =>
      import('./features/core-hr/pages/core-hr-records-rebuild.component').then((m) => m.CoreHrRecordsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Promotions', recordType: 'promotions' }
  },
  {
    path: 'core-hr/transfers',
    loadComponent: () =>
      import('./features/core-hr/pages/core-hr-records-rebuild.component').then((m) => m.CoreHrRecordsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Transfers', recordType: 'transfers' }
  },
  {
    path: 'core-hr/awards',
    loadComponent: () =>
      import('./features/core-hr/pages/core-hr-records-rebuild.component').then((m) => m.CoreHrRecordsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Awards', recordType: 'awards' }
  },
  {
    path: 'core-hr/warnings',
    loadComponent: () =>
      import('./features/core-hr/pages/core-hr-records-rebuild.component').then((m) => m.CoreHrRecordsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Warnings', recordType: 'warnings' }
  },
  {
    path: 'core-hr/resignations',
    loadComponent: () =>
      import('./features/core-hr/pages/core-hr-records-rebuild.component').then((m) => m.CoreHrRecordsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Resignations', recordType: 'resignations' }
  },
  {
    path: 'core-hr/terminations',
    loadComponent: () =>
      import('./features/core-hr/pages/core-hr-records-rebuild.component').then((m) => m.CoreHrRecordsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Terminations', recordType: 'terminations' }
  },
  {
    path: 'core-hr/complaints',
    loadComponent: () =>
      import('./features/core-hr/pages/core-hr-records-rebuild.component').then((m) => m.CoreHrRecordsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Complaints', recordType: 'complaints' }
  },
  {
    path: 'core-hr/travel',
    loadComponent: () =>
      import('./features/core-hr/pages/core-hr-records-rebuild.component').then((m) => m.CoreHrRecordsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Travel', recordType: 'travel' }
  },
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
  {
    path: 'organization/chart',
    loadComponent: () =>
      import('./features/organization/pages/organization-chart-rebuild.component').then(
        (m) => m.OrganizationChartRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Organization Chart' }
  },
  {
    path: 'organization/settings',
    loadComponent: () =>
      import('./features/organization/pages/organization-settings-rebuild.component').then(
        (m) => m.OrganizationSettingsRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Organization Settings' }
  },
  {
    path: 'payroll',
    loadComponent: () =>
      import('./features/payroll/pages/payroll-rebuild.component').then((m) => m.PayrollRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Payroll' }
  },
  {
    path: 'payroll/:id',
    loadComponent: () =>
      import('./features/payroll/pages/payroll-run-rebuild.component').then((m) => m.PayrollRunRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Payroll Run' }
  },
  {
    path: 'payroll/slip/:id',
    loadComponent: () =>
      import('./features/payroll/pages/payslip-view-rebuild.component').then((m) => m.PayslipViewRebuildComponent),
    canActivate: [authGuard],
    data: { title: 'Payslip View' }
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/pages/reports-rebuild.component').then((m) => m.ReportsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Reports' }
  },
  {
    path: 'reports/attendance',
    loadComponent: () =>
      import('./features/reports/pages/reports-attendance-rebuild.component').then(
        (m) => m.ReportsAttendanceRebuildComponent
      ),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Attendance Report' }
  },
  {
    path: 'reports/analytics',
    loadComponent: () =>
      import('./features/reports/pages/reports-analytics-rebuild.component').then((m) => m.ReportsAnalyticsRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Analytics Report' }
  },
  {
    path: 'reports/payroll',
    loadComponent: () =>
      import('./features/reports/pages/reports-payroll-rebuild.component').then((m) => m.ReportsPayrollRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Payroll Report' }
  },
  {
    path: 'reports/tax',
    loadComponent: () =>
      import('./features/reports/pages/reports-tax-rebuild.component').then((m) => m.ReportsTaxRebuildComponent),
    canActivate: [authGuard, roleGuard(['super_admin', 'admin', 'hr_manager'])],
    data: { title: 'Tax Report' }
  },
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
