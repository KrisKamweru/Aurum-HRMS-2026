import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeVariant, UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { RebuildTrainingCourse, TrainingCourseStatus, TrainingCourseType } from '../data/training-rebuild.models';
import { TrainingRebuildStore } from '../data/training-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-training-catalog-rebuild',
  imports: [DatePipe, UiBadgeComponent, UiButtonComponent],
  template: ''
})
export class TrainingCatalogRebuildComponent implements OnInit {
  private readonly store = inject(TrainingRebuildStore);
  private readonly router = inject(Router);

  readonly courses = this.store.courses;
  readonly catalogLoading = this.store.catalogLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;
  readonly canManage = this.store.canManage;
  readonly canEnroll = this.store.canEnroll;
  readonly upcomingCount = this.store.upcomingCourseCount;
  readonly inProgressCount = this.store.inProgressCourseCount;
  readonly completedCount = this.store.completedCourseCount;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    void this.store.loadCatalog();
  }

  openMyLearning(): void {
    void this.router.navigate(['/training/my-learning']);
  }

  openCreateCourse(): void {
    void this.router.navigate(['/training/courses/new']);
  }

  editCourse(id: string): void {
    void this.router.navigate(['/training/courses', id, 'edit']);
  }

  async enroll(id: string): Promise<void> {
    const success = await this.store.enrollInCourse(id);
    if (success) {
      void this.router.navigate(['/training/my-learning']);
    }
  }

  canEnrollInCourse(course: RebuildTrainingCourse): boolean {
    return this.canEnroll() && (course.status === 'upcoming' || course.status === 'in_progress');
  }

  courseStatusVariant(status: TrainingCourseStatus): BadgeVariant {
    if (status === 'upcoming') {
      return 'info';
    }
    if (status === 'in_progress') {
      return 'success';
    }
    if (status === 'cancelled') {
      return 'danger';
    }
    return 'neutral';
  }

  courseTypeLabel(type: TrainingCourseType): string {
    if (type === 'workshop') {
      return 'Workshop';
    }
    if (type === 'seminar') {
      return 'Seminar';
    }
    if (type === 'online') {
      return 'Online';
    }
    return 'Other';
  }
}
