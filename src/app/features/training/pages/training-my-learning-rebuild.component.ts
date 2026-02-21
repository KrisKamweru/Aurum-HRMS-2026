import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeVariant, UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { TrainingEnrollmentStatus } from '../data/training-rebuild.models';
import { TrainingRebuildStore } from '../data/training-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-training-my-learning-rebuild',
  imports: [DatePipe, UiBadgeComponent, UiButtonComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">My Learning</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Track course progress, completion milestones, and active enrollments.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <ui-button variant="secondary" size="sm" [disabled]="myLearningLoading()" (onClick)="refresh()">Refresh</ui-button>
          <ui-button variant="outline" size="sm" (onClick)="browseCatalog()">Browse Catalog</ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="myLearningLoading()" (onClick)="refresh()">Retry</ui-button>
        </section>
      }

      @if (myLearningLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-36 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else if (myLearning().length === 0) {
        <section class="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <p class="text-lg font-semibold text-stone-800 dark:text-stone-100">No active enrollments</p>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">Browse the catalog and enroll in a training course.</p>
          <div class="mt-4 flex justify-center">
            <ui-button variant="primary" size="sm" (onClick)="browseCatalog()">Browse Catalog</ui-button>
          </div>
        </section>
      } @else {
        <section class="grid gap-4">
          @for (enrollment of myLearning(); track enrollment.id) {
            <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">{{ enrollment.courseTitle }}</h2>
                  <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
                    Enrolled {{ enrollment.enrollmentDate | date: 'MMM d, y' }}
                    @if (enrollment.courseStartDate) {
                      · Starts {{ enrollment.courseStartDate | date: 'MMM d, y' }}
                    }
                  </p>
                </div>
                <ui-badge size="sm" [rounded]="true" [variant]="enrollmentStatusVariant(enrollment.status)">
                  {{ enrollment.status }}
                </ui-badge>
              </div>

              <div class="mt-4 space-y-2">
                <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  <span>Progress</span>
                  <span>{{ enrollment.progress }}%</span>
                </div>
                <div class="h-2.5 rounded-full bg-stone-100 dark:bg-white/[0.08]">
                  <div class="h-full rounded-full bg-burgundy-700 transition-all" [style.width.%]="enrollment.progress"></div>
                </div>
                @if (enrollment.completionDate) {
                  <p class="text-xs text-stone-500 dark:text-stone-400">
                    Completed {{ enrollment.completionDate | date: 'MMM d, y' }}
                  </p>
                }
              </div>
            </article>
          }
        </section>
      }
    </main>
  `
})
export class TrainingMyLearningRebuildComponent implements OnInit {
  private readonly store = inject(TrainingRebuildStore);
  private readonly router = inject(Router);

  readonly myLearning = this.store.myLearning;
  readonly myLearningLoading = this.store.myLearningLoading;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    void this.store.loadMyLearning();
  }

  browseCatalog(): void {
    void this.router.navigate(['/training/catalog']);
  }

  enrollmentStatusVariant(status: TrainingEnrollmentStatus): BadgeVariant {
    if (status === 'completed') {
      return 'success';
    }
    if (status === 'failed') {
      return 'danger';
    }
    if (status === 'enrolled') {
      return 'info';
    }
    return 'neutral';
  }
}
