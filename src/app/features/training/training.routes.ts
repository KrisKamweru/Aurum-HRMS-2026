import { Routes } from '@angular/router';
import { TrainingComponent } from './training.component';
import { CourseListComponent } from './components/course-list/course-list.component';
import { MyLearningComponent } from './components/my-learning/my-learning.component';
import { CourseFormComponent } from './components/course-form/course-form.component';
import { roleGuard } from '../../core/auth/role.guard';

export const TRAINING_ROUTES: Routes = [
  {
    path: '',
    component: TrainingComponent,
    children: [
      { path: '', redirectTo: 'catalog', pathMatch: 'full' },
      {
        path: 'catalog',
        component: CourseListComponent
      },
      {
        path: 'my-learning',
        component: MyLearningComponent
      },
      {
        path: 'courses/new',
        component: CourseFormComponent,
        canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]
      },
      {
        path: 'courses/:id/edit',
        component: CourseFormComponent,
        canActivate: [roleGuard(['super_admin', 'admin', 'hr_manager', 'manager'])]
      }
    ]
  }
];
