import { Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { GeneralSettingsComponent } from './components/general-settings/general-settings.component';
import { LeavePolicyListComponent } from './components/leave-policy-list/leave-policy-list.component';
import { roleGuard } from '../../core/auth/role.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      { path: 'general', component: GeneralSettingsComponent },
      { path: 'leave-policies', component: LeavePolicyListComponent }
    ],
    canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager'])]
  }
];
