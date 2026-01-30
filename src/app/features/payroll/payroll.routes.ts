import { Routes } from '@angular/router';
import { PayrollListComponent } from './payroll-list.component';
import { PayrollRunComponent } from './payroll-run.component';
import { PayslipViewComponent } from './payslip-view.component';
import { roleGuard } from '../../core/auth/role.guard';
import { authGuard } from '../../core/auth/auth.guard';

export const PAYROLL_ROUTES: Routes = [
  {
    path: '',
    component: PayrollListComponent,
    canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
  },
  {
    path: 'slip/:id',
    component: PayslipViewComponent,
    canActivate: [authGuard] // Logic inside component checks ownership
  },
  {
    path: ':id',
    component: PayrollRunComponent,
    canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
  }
];
