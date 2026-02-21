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
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Training Catalog</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Browse active learning programs and enroll employees in skill development tracks.
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <ui-badge variant="primary" size="sm" [rounded]="true">Upcoming {{ upcomingCount() }}</ui-badge>
            <ui-badge variant="success" size="sm" [rounded]="true">In Progress {{ inProgressCount() }}</ui-badge>
            <ui-badge variant="neutral" size="sm" [rounded]="true">Completed {{ completedCount() }}</ui-badge>
            <ui-badge variant="neutral" size="sm" [rounded]="true">Total {{ courses().length }}</ui-badge>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="catalogLoading()" (onClick)="refresh()">Refresh</ui-button>
          <ui-button variant="outline" size="sm" (onClick)="openMyLearning()">My Learning</ui-button>
          @if (canManage()) {
            <ui-button variant="primary" size="sm" (onClick)="openCreateCourse()">Create Course</ui-button>
          }
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="catalogLoading()" (onClick)="refresh()">Retry</ui-button>
        </section>
      }

      @if (catalogLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-40 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else if (courses().length === 0) {
        <section class="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-lg font-semibold text-stone-800 dark:text-stone-100">No courses available</p>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">Create your first course to start training operations.</p>
          @if (canManage()) {
            <div class="mt-4 flex justify-center">
              <ui-button variant="primary" size="sm" (onClick)="openCreateCourse()">Create Course</ui-button>
            </div>
          }
        </section>
      } @else {
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-white/8">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Course List</p>
            <p class="text-xs text-stone-500 dark:text-stone-400">Enrollment ready</p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
                <tr>
                  <th class="px-4 py-3">Course</th>
                  <th class="px-4 py-3">Schedule</th>
                  <th class="px-4 py-3">Format</th>
                  <th class="px-4 py-3">Capacity</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (course of courses(); track course.id) {
                  <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                    <td class="px-4 py-3">
                      <p class="font-semibold text-stone-800 dark:text-stone-100">{{ course.title }}</p>
                      <p class="text-xs text-stone-500 dark:text-stone-400">
                        {{ course.instructor || 'Instructor not set' }}
                      </p>
                    </td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">
                      <p>{{ course.startDate | date: 'MMM d, y' }}</p>
                      <p class="text-xs text-stone-500 dark:text-stone-400">{{ course.endDate | date: 'MMM d, y' }}</p>
                    </td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ courseTypeLabel(course.type) }}</td>
                    <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ course.capacity ?? 'Open' }}</td>
                    <td class="px-4 py-3">
                      <ui-badge size="sm" [rounded]="true" [variant]="courseStatusVariant(course.status)">
                        {{ course.status }}
                      </ui-badge>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex justify-end gap-2">
                        <ui-button
                          variant="outline"
                          size="sm"
                          [disabled]="!canEnrollInCourse(course) || isSaving()"
                          (onClick)="enroll(course.id)"
                        >
                          Enroll
                        </ui-button>
                        @if (canManage()) {
                          <ui-button variant="secondary" size="sm" [disabled]="isSaving()" (onClick)="editCourse(course.id)">
                            Edit
                          </ui-button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </main>
  `
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
