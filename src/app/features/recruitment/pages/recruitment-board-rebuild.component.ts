import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ApplicationStatus } from '../data/recruitment-rebuild.models';
import { RecruitmentRebuildStore } from '../data/recruitment-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recruitment-board-rebuild',
  imports: [DatePipe, UiBadgeComponent, UiButtonComponent],
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Candidate Board</h1>
          <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
            Review recruitment applications and move candidates through the hiring pipeline.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select
            class="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 dark:border-white/8 dark:bg-white/[0.04] dark:text-stone-200"
            [value]="selectedJobId()"
            (change)="onJobFilterChange($event)"
          >
            <option value="">All Jobs</option>
            @for (job of jobs(); track job.id) {
              <option [value]="job.id">{{ job.title }}</option>
            }
          </select>
          <ui-button variant="secondary" size="sm" [disabled]="boardLoading()" (onClick)="refresh()">Refresh</ui-button>
          <ui-button variant="outline" size="sm" (onClick)="backToJobs()">Back to Jobs</ui-button>
        </div>
      </section>

      @if (error()) {
        <section class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" [disabled]="boardLoading()" (onClick)="refresh()">Retry</ui-button>
        </section>
      }

      @if (boardLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-4 w-40 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-28 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else {
        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="border-b border-stone-200 px-4 py-3 dark:border-white/8">
            <p class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Applications</p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-[#eeedf0] text-xs font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.02] dark:text-stone-400">
                <tr>
                  <th class="px-4 py-3">Candidate</th>
                  <th class="px-4 py-3">Job</th>
                  <th class="px-4 py-3">Applied</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (applications().length === 0) {
                  <tr>
                    <td colspan="5" class="px-4 py-5 text-center text-stone-500 dark:text-stone-400">No applications found.</td>
                  </tr>
                } @else {
                  @for (application of applications(); track application.id) {
                    <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                      <td class="px-4 py-3">
                        <p class="font-semibold text-stone-800 dark:text-stone-100">{{ application.candidateName }}</p>
                        <p class="text-xs text-stone-500 dark:text-stone-400">{{ application.candidateEmail || 'No email' }}</p>
                      </td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ application.jobTitle }}</td>
                      <td class="px-4 py-3 text-stone-600 dark:text-stone-300">{{ application.appliedAt | date: 'MMM d, y' }}</td>
                      <td class="px-4 py-3">
                        <ui-badge size="sm" [rounded]="true" [variant]="statusVariant(application.status)">
                          {{ application.status }}
                        </ui-badge>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex justify-end gap-2">
                          <select
                            class="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 dark:border-white/8 dark:bg-white/[0.04] dark:text-stone-200"
                            [disabled]="!canManage() || isSaving()"
                            [value]="application.status"
                            (change)="updateStatus(application.id, $event)"
                          >
                            <option value="new">New</option>
                            <option value="screening">Screening</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <ui-button variant="outline" size="sm" (onClick)="viewJob(application.jobId)">Job</ui-button>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </main>
  `
})
export class RecruitmentBoardRebuildComponent implements OnInit {
  private readonly store = inject(RecruitmentRebuildStore);
  private readonly router = inject(Router);

  readonly jobs = this.store.jobs;
  readonly applications = this.store.applications;
  readonly boardLoading = this.store.boardLoading;
  readonly isSaving = this.store.isSaving;
  readonly canManage = this.store.canManage;
  readonly error = this.store.error;

  readonly selectedJobId = signal('');
  readonly selectedJobApplicationCount = computed(() =>
    this.applications().filter((application) =>
      this.selectedJobId() ? application.jobId === this.selectedJobId() : true
    ).length
  );

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    void this.store.loadBoard(this.selectedJobId() || undefined);
  }

  onJobFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.selectedJobId.set(target?.value ?? '');
    this.refresh();
  }

  async updateStatus(id: string, event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement | null;
    const status = target?.value;
    if (!this.isApplicationStatus(status)) {
      return;
    }
    await this.store.updateApplicationStatus(id, status);
  }

  viewJob(jobId: string): void {
    void this.router.navigate(['/recruitment/jobs', jobId]);
  }

  backToJobs(): void {
    void this.router.navigate(['/recruitment/jobs']);
  }

  statusVariant(status: ApplicationStatus): BadgeVariant {
    if (status === 'hired') {
      return 'success';
    }
    if (status === 'rejected') {
      return 'danger';
    }
    if (status === 'offer' || status === 'interview') {
      return 'warning';
    }
    return 'info';
  }

  private isApplicationStatus(value: string | undefined): value is ApplicationStatus {
    return (
      value === 'new' ||
      value === 'screening' ||
      value === 'interview' ||
      value === 'offer' ||
      value === 'hired' ||
      value === 'rejected'
    );
  }
}
