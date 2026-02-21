import { Routes } from '@angular/router';
import { AttendanceComponent } from './attendance.component';
import { roleGuard } from '../../core/auth/role.guard';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: 'team',
    loadComponent: () => import('./team-attendance/team-attendance.component').then(m => m.TeamAttendanceComponent),
    canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]
  },
  {
    path: '',
    pathMatch: 'full',
    component: AttendanceComponent
  }
];
// trigger rebuild
