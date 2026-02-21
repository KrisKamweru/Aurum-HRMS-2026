import { Routes } from '@angular/router';
import { RecruitmentComponent } from './recruitment.component';
import { JobListComponent } from './components/job-list/job-list.component';
import { JobFormComponent } from './components/job-form/job-form.component';
import { JobDetailComponent } from './components/job-detail/job-detail.component';
import { CandidateBoardComponent } from './components/candidate-board/candidate-board.component';
import { roleGuard } from '../../core/auth/role.guard';

export const RECRUITMENT_ROUTES: Routes = [
  {
    path: '',
    component: RecruitmentComponent,
    children: [
      { path: '', redirectTo: 'jobs', pathMatch: 'full' },
      {
        path: 'jobs',
        component: JobListComponent
      },
      {
        path: 'jobs/new',
        component: JobFormComponent,
        canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]
      },
      {
        path: 'jobs/:id',
        component: JobDetailComponent
      },
      {
        path: 'jobs/:id/edit',
        component: JobFormComponent,
        canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]
      },
      {
        path: 'board',
        component: CandidateBoardComponent,
        canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]
      }
    ]
  }
];
